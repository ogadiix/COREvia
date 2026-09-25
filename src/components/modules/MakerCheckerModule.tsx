import React, { useState } from 'react';
import { PendingAuthorization, MakerCheckerAction } from '../../types';
import { Table, Column } from '../common/Table';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { StatCard } from '../common/StatCard';
import { Modal } from '../common/Modal';
import { formatINR } from '../../data/mockIndianBankingData';
import { useAuth } from '../../context/AuthContext';
import {
  CheckCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Building,
  Lock,
  Eye,
  Fingerprint,
  ShieldCheck,
} from 'lucide-react';

interface MakerCheckerModuleProps {
  pendingAuthorizations: PendingAuthorization[];
  onApprove: (item: PendingAuthorization, checkerRemark: string) => void;
  onReject: (item: PendingAuthorization, checkerRemark: string) => void;
}

export const MakerCheckerModule: React.FC<MakerCheckerModuleProps> = ({
  pendingAuthorizations,
  onApprove,
  onReject,
}) => {
  const { user, hasPermission, hasRole } = useAuth();
  const [activeItem, setActiveItem] = useState<PendingAuthorization | null>(null);
  const [checkerRemark, setCheckerRemark] = useState<string>('');
  const [remarkError, setRemarkError] = useState<boolean>(false);

  // RBAC: Check if current officer has authorization privilege
  const canAuthorize = hasPermission('maker_checker:authorize') || hasRole('ADMINISTRATOR', 'BRANCH_MANAGER');

  // Segregation of duties check for active modal item
  const isOwnVoucher = activeItem ? activeItem.makerUserId === user?.employeeId : false;

  const handleOpenAction = (item: PendingAuthorization) => {
    setActiveItem(item);
    setCheckerRemark('');
    setRemarkError(false);
  };

  const handleApprove = () => {
    if (!canAuthorize || isOwnVoucher) return;
    if (!checkerRemark.trim()) {
      setRemarkError(true);
      return;
    }
    if (activeItem) {
      onApprove(activeItem, checkerRemark);
      setActiveItem(null);
    }
  };

  const handleReject = () => {
    if (!canAuthorize || isOwnVoucher) return;
    if (!checkerRemark.trim()) {
      setRemarkError(true);
      return;
    }
    if (activeItem) {
      onReject(activeItem, checkerRemark);
      setActiveItem(null);
    }
  };

  const columns: Column<PendingAuthorization>[] = [
    {
      key: 'voucherNumber',
      header: 'Voucher / Ref #',
      mono: true,
      render: (item) => (
        <div>
          <span className="font-mono font-semibold text-slate-900">{item.voucherNumber}</span>
          <div className="text-[10px] text-slate-500 font-mono">{item.timestamp}</div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Operational Request',
      render: (item) => (
        <div className="max-w-[260px]">
          <div className="font-semibold text-slate-900 truncate">{item.description}</div>
          <div className="text-[11px] text-slate-500 truncate">
            {item.auditReason}
          </div>
        </div>
      ),
    },
    {
      key: 'makerUserName',
      header: 'Initiating Maker',
      render: (item) => (
        <div>
          <div className="font-medium text-slate-800">{item.makerUserName}</div>
          <div className="text-[10px] text-slate-500 font-mono">ID: {item.makerUserId} • {item.makerRole}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount (INR)',
      align: 'right',
      mono: true,
      render: (item) => (
        <span className="font-mono font-bold text-slate-900">
          {item.amount ? formatINR(item.amount) : '—'}
        </span>
      ),
    },
    {
      key: 'criticality',
      header: 'Criticality & Security',
      align: 'center',
      render: (item) => {
        return (
          <div className="flex flex-col items-center gap-1">
            {item.criticality === 'CRITICAL' ? (
              <Badge variant="danger" size="sm">CRITICAL</Badge>
            ) : item.criticality === 'HIGH' ? (
              <Badge variant="warning" size="sm">HIGH</Badge>
            ) : (
              <Badge variant="neutral" size="sm">NORMAL</Badge>
            )}
            {item.biometricVerification?.verified && (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300"
                title={`Biometrically signed via ${item.biometricVerification.method}`}
              >
                <Fingerprint className="w-2.5 h-2.5 text-emerald-600" />
                BIO-SIGNED
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (item) => {
        const isSelf = item.makerUserId === user?.employeeId;
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {isSelf && (
              <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-mono">
                Initiated by You
              </span>
            )}
            <Button
              size="sm"
              variant={canAuthorize && !isSelf ? 'primary' : 'outline'}
              onClick={() => handleOpenAction(item)}
              icon={canAuthorize && !isSelf ? <CheckCheck className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            >
              {canAuthorize && !isSelf ? 'Review & Sign' : 'Inspect Voucher'}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top Banner explaining Four Eyes Mandate */}
      <div className={`border rounded p-3.5 flex items-start gap-3 ${
        canAuthorize ? 'bg-amber-50/70 border-amber-300' : 'bg-slate-100 border-slate-300'
      }`}>
        <ShieldAlert className={`w-5 h-5 shrink-0 mt-0.5 ${canAuthorize ? 'text-amber-700' : 'text-slate-600'}`} />
        <div className="text-xs">
          <div className="font-semibold text-slate-900 flex items-center gap-2">
            <span>Four-Eyes Principle Verification Mandate (RBI Circular RBI/2024-25/112)</span>
            {!canAuthorize && (
              <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                READ-ONLY QUEUE ACCESS
              </span>
            )}
          </div>
          <p className="text-slate-700 mt-0.5 leading-relaxed">
            All debits exceeding ₹1.00 Crore, physical cash movements, lien modifications, and KYC reclassifications require dual-authorization by a designated Level-3 Checker before core ledger commitment.
          </p>
          {!canAuthorize && (
            <p className="text-amber-800 font-medium mt-1">
              Active profile: <strong>{user?.name}</strong> ({user?.roleName || user?.role}). Only Level-2/3 Checkers (Branch Manager, Admin) hold sign-off authority.
            </p>
          )}
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="Pending Sign-Offs"
          value={`${pendingAuthorizations.length}`}
          code="QUEUE-L3"
          subtext="Awaiting Checker Verification"
          regulatoryBadge={
            pendingAuthorizations.length > 0
              ? { text: 'Immediate Action', status: 'warning' }
              : { text: 'All Clear', status: 'compliant' }
          }
        />

        <StatCard
          label="Active Checker Authority"
          value="Aditya Raj"
          code="EMP-782194"
          subtext="Level-3 Operations Head (Fort 0104)"
        />

        <StatCard
          label="Queue Turnaround Time (TAT)"
          value="4.2 mins"
          code="TAT-TARGET <15m"
          subtext="Within Service Level Agreement"
          regulatoryBadge={{
            text: 'Optimal',
            status: 'compliant',
          }}
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded">
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-slate-700" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Active Authorization Queue
            </h2>
            <span className="font-mono text-xs px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
              {pendingAuthorizations.length} items
            </span>
          </div>
        </div>

        <Table
          columns={columns}
          data={pendingAuthorizations}
          keyExtractor={(item) => item.id}
          emptyMessage="No pending items in the Checker Authorization queue. All transactions are authorized."
        />
      </div>

      {/* Detailed Authorization Review Modal */}
      {activeItem && (
        <Modal
          isOpen={!!activeItem}
          onClose={() => setActiveItem(null)}
          title={`Dual-Control Authorization Sign-Off`}
          subtitle={activeItem.description}
          referenceId={activeItem.voucherNumber}
          maxWidth="xl"
          footerActions={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveItem(null)}
              >
                Close
              </Button>
              {canAuthorize && !isOwnVoucher ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleReject}
                    icon={<XCircle className="w-3.5 h-3.5" />}
                  >
                    Reject & Return to Maker
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleApprove}
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Approve & Commit Ledger
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-mono italic">
                    {isOwnVoucher ? 'Self-initiated voucher (Dual-control lock)' : 'Supervisory sign-off restricted'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    icon={<Lock className="w-3.5 h-3.5" />}
                  >
                    Sign-Off Locked
                  </Button>
                </div>
              )}
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Segregation of Duties or Insufficient Entitlements Warning */}
            {isOwnVoucher && (
              <div className="bg-rose-50 border border-rose-300 rounded p-3 flex items-start gap-2.5 text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-[11px] uppercase tracking-wide">
                    Segregation of Duties Conflict
                  </div>
                  <p className="text-[11px] leading-relaxed text-rose-800">
                    You initiated this operational request (Maker: <strong>{activeItem.makerUserName}</strong>, {activeItem.makerUserId}). Under RBI dual-control mandates, the same officer is prohibited from acting as both Maker and Checker. Another designated supervisory checker must review and sign off.
                  </p>
                </div>
              </div>
            )}

            {!canAuthorize && !isOwnVoucher && (
              <div className="bg-slate-100 border border-slate-300 rounded p-3 flex items-start gap-2.5 text-slate-800">
                <Lock className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-[11px] uppercase tracking-wide">
                    Supervisory Sign-Off Entitlement Required
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    Your authenticated profile (<strong>{user?.name}</strong>, {user?.roleName || user?.role}) does not hold Level-2/3 Checker sign-off permissions. You may inspect the voucher parameters in read-only mode.
                  </p>
                </div>
              </div>
            )}

            {/* Amount / Action Headline */}
            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-center">
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                {activeItem.actionType.replace(/_/g, ' ')}
              </div>
              {activeItem.amount && (
                <div className="font-mono text-2xl font-bold text-slate-900 mt-1">
                  {formatINR(activeItem.amount)}
                </div>
              )}
              <div className="text-[11px] text-slate-600 mt-1">{activeItem.auditReason}</div>
            </div>

            {/* Maker Identification */}
            <div className="border border-slate-200 rounded p-3 bg-white space-y-1.5">
              <div className="font-semibold text-slate-900 text-[11px] uppercase tracking-wide border-b border-slate-100 pb-1">
                Initiating Maker Credentials
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Maker Officer:</span>
                <span className="font-medium text-slate-900">{activeItem.makerUserName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Employee ID / Role:</span>
                <span className="font-mono text-slate-700">{activeItem.makerUserId} ({activeItem.makerRole})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="font-mono text-slate-700">{activeItem.timestamp}</span>
              </div>
            </div>

            {/* Officer Biometric Step-Up Certificate (If high-value authenticated) */}
            {activeItem.biometricVerification?.verified && (
              <div className="border border-emerald-300 rounded p-3 bg-emerald-50/50 space-y-2 text-emerald-950">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-900">
                    <Fingerprint className="w-4 h-4 text-emerald-700" />
                    <span>Maker Biometric Signature Certificate (FIDO2 / STQC L1)</span>
                  </div>
                  <Badge variant="success" size="sm">
                    CRYPTOGRAPHICALLY VERIFIED
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-emerald-700 font-sans">Modality:</span>{' '}
                    <span className="font-semibold text-emerald-900">
                      {activeItem.biometricVerification.method === 'FINGERPRINT_STQC_L1'
                        ? 'STQC Level-1 Optical Fingerprint'
                        : activeItem.biometricVerification.method === 'FACE_ID_LIVENESS'
                        ? 'TrueDepth 3D IR FaceID Liveness'
                        : 'Hardware RSA Token'}
                    </span>
                  </div>

                  <div>
                    <span className="text-emerald-700 font-sans">Quality Score:</span>{' '}
                    <span className="font-semibold text-emerald-900">
                      {activeItem.biometricVerification.qualityScore
                        ? `${activeItem.biometricVerification.qualityScore}% (NFIQ High)`
                        : 'Passed'}
                    </span>
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-between pt-1 border-t border-emerald-200/60 text-[10px]">
                    <span className="text-emerald-700 font-sans truncate mr-2">
                      FIDO2 Token: {activeItem.biometricVerification.tokenHash}
                    </span>
                    <span className="text-emerald-800">
                      Signed: {activeItem.biometricVerification.verifiedAt}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-emerald-800 flex items-center gap-1 font-sans">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Complies with RBI Digital Payment Security Controls (Section 4.3) for High-Value Clearings.</span>
                </div>
              </div>
            )}

            {/* Parameter Details */}
            {activeItem.details && (
              <div className="border border-slate-200 rounded p-3 bg-white space-y-1.5">
                <div className="font-semibold text-slate-900 text-[11px] uppercase tracking-wide border-b border-slate-100 pb-1">
                  Voucher Parameter Specifications
                </div>
                {Object.entries(activeItem.details).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className="font-mono font-medium text-slate-900">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Mandatory Checker Remarks Input */}
            {canAuthorize && !isOwnVoucher ? (
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-900 text-[11px] uppercase tracking-wide">
                  Mandatory Checker Verification Remark <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter mandatory supervisory verification justification (e.g., 'Verified mandate, invoice PO-49201, and remitter ledger balance; approved for outward RTGS dispatch')."
                  value={checkerRemark}
                  onChange={(e) => {
                    setCheckerRemark(e.target.value);
                    if (remarkError) setRemarkError(false);
                  }}
                  className={`w-full p-2 text-xs bg-slate-50 border rounded focus:bg-white focus:outline-none focus:ring-1 ${
                    remarkError ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:ring-slate-400'
                  }`}
                />
                {remarkError && (
                  <p className="text-[11px] text-rose-600">
                    A verification remark is legally required by RBI audit rules before signing off.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-500 italic">
                {isOwnVoucher
                  ? 'Verification remarks input disabled: Maker cannot enter Checker remarks on self-initiated vouchers.'
                  : 'Verification remarks input disabled: Level-2/3 Checker authority required.'}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
