import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { BiometricVerificationPayload } from '../../types';
import { formatINR } from '../../data/mockIndianBankingData';
import {
  Fingerprint,
  ScanFace,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Cpu,
  Lock,
  Terminal,
} from 'lucide-react';

interface BiometricAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  sourceAccount: string;
  destName: string;
  rail: string;
  officerName: string;
  officerEmployeeId: string;
  terminalId?: string;
  onVerified: (payload: BiometricVerificationPayload) => void;
}

type ScanStatus = 'IDLE' | 'SCANNING' | 'SUCCESS' | 'FAILED';
type AuthMode = 'FINGERPRINT' | 'FACE_ID' | 'HARDWARE_TOKEN';

export const BiometricAuthModal: React.FC<BiometricAuthModalProps> = ({
  isOpen,
  onClose,
  amount,
  sourceAccount,
  destName,
  rail,
  officerName,
  officerEmployeeId,
  terminalId = 'TER-MUM-0104-D',
  onVerified,
}) => {
  const [authMode, setAuthMode] = useState<AuthMode>('FINGERPRINT');
  const [scanStatus, setScanStatus] = useState<ScanStatus>('IDLE');
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [qualityScore, setQualityScore] = useState<number>(98.4);
  const [tokenInput, setTokenInput] = useState<string>('849201');

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setScanStatus('IDLE');
      setScanProgress(0);
      setGeneratedToken(null);
    }
  }, [isOpen]);

  const startScan = (simulateFailure = false) => {
    setScanStatus('SCANNING');
    setScanProgress(0);
    setGeneratedToken(null);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setScanProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        if (simulateFailure) {
          setScanStatus('FAILED');
        } else {
          setScanStatus('SUCCESS');
          const token = `FIDO2-STQC-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-4)}`;
          setGeneratedToken(token);
          setQualityScore(authMode === 'FINGERPRINT' ? 98.7 : 99.2);
        }
      }
    }, 250);
  };

  const handleConfirmSubmission = () => {
    if (scanStatus !== 'SUCCESS' && authMode !== 'HARDWARE_TOKEN') return;

    const token = generatedToken || `RSA-TOKEN-${tokenInput}-${Date.now().toString().slice(-4)}`;
    const method =
      authMode === 'FINGERPRINT'
        ? 'FINGERPRINT_STQC_L1'
        : authMode === 'FACE_ID'
        ? 'FACE_ID_LIVENESS'
        : 'HARDWARE_TOKEN_FALLBACK';

    onVerified({
      verified: true,
      method,
      tokenHash: token,
      verifiedAt: new Date().toLocaleTimeString('en-IN') + ' IST',
      officerEmployeeId,
      officerName,
      terminalId,
      qualityScore,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="High-Value Biometric Re-Authentication"
      subtitle="RBI Master Direction – Dual-Factor Biometric Step-Up for debits above ₹5.00 Crore"
      maxWidth="lg"
      footerActions={
        <div className="flex items-center justify-between w-full">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>FIDO2 / STQC Level-1 Cryptographic Enclave</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Abort Voucher
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={scanStatus !== 'SUCCESS' && authMode !== 'HARDWARE_TOKEN'}
              onClick={handleConfirmSubmission}
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
            >
              Move to Maker-Checker Queue
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Regulatory Banner */}
        <div className="bg-amber-50 border border-amber-300 rounded p-3 text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-semibold text-xs">
              Mandatory Officer Biometric Signature Required (&gt; ₹5.00 Crore Threshold)
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              In compliance with RBI IT Governance & Cyber Security Framework, outward settlements exceeding ₹5.00 Crore must capture a certified biometric signature before dispatch to the Maker-Checker authorization queue.
            </p>
          </div>
        </div>

        {/* Transaction Brief Card */}
        <div className="bg-slate-50 border border-slate-200 rounded p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-slate-500 uppercase tracking-wider text-[10px]">Voucher Value</span>
            <div className="font-mono text-lg font-bold text-slate-900">
              {formatINR(amount)}
            </div>
            <div className="text-slate-500 font-mono">Clearing Channel: {rail}</div>
          </div>

          <div>
            <span className="text-slate-500 uppercase tracking-wider text-[10px]">Beneficiary / Account</span>
            <div className="font-semibold text-slate-800 truncate">{destName}</div>
            <div className="text-slate-500 font-mono">Debiting CASA: {sourceAccount}</div>
          </div>

          <div className="pt-2 border-t border-slate-200 sm:col-span-2 flex flex-wrap justify-between items-center text-[10px] text-slate-500">
            <span className="flex items-center gap-1 font-mono">
              <Terminal className="w-3 h-3 text-slate-400" />
              Terminal: {terminalId}
            </span>
            <span className="font-mono">
              Initiating Officer: {officerName} ({officerEmployeeId})
            </span>
          </div>
        </div>

        {/* Modality Selector Tabs */}
        <div className="flex items-center justify-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => {
              setAuthMode('FINGERPRINT');
              setScanStatus('IDLE');
              setGeneratedToken(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
              authMode === 'FINGERPRINT'
                ? 'bg-[#0f1e36] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>STQC Optical Fingerprint (L1)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('FACE_ID');
              setScanStatus('IDLE');
              setGeneratedToken(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
              authMode === 'FACE_ID'
                ? 'bg-[#0f1e36] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ScanFace className="w-3.5 h-3.5" />
            <span>FaceID / 3D IR Mesh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('HARDWARE_TOKEN');
              setScanStatus('SUCCESS');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
              authMode === 'HARDWARE_TOKEN'
                ? 'bg-[#0f1e36] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Hardware RSA Token (Fallback)</span>
          </button>
        </div>

        {/* Scanner Simulation Area */}
        <div className="border border-slate-200 rounded p-6 bg-slate-900 text-white flex flex-col items-center justify-center relative overflow-hidden shadow-inner min-h-[260px]">
          {/* Background Tech Grid Lines */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:16px_16px]" />

          {/* FINGERPRINT MODE */}
          {authMode === 'FINGERPRINT' && (
            <div className="relative z-10 flex flex-col items-center text-center space-y-3">
              {/* Sensor Aperture Ring */}
              <div
                onClick={() => scanStatus === 'IDLE' && startScan(false)}
                className={`relative w-28 h-28 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                  scanStatus === 'SUCCESS'
                    ? 'border-emerald-400 bg-emerald-950/40 shadow-[0_0_25px_rgba(52,211,153,0.3)]'
                    : scanStatus === 'SCANNING'
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                    : scanStatus === 'FAILED'
                    ? 'border-rose-400 bg-rose-950/40 shadow-[0_0_20px_rgba(251,113,133,0.3)]'
                    : 'border-slate-700 bg-slate-800/80 hover:border-slate-500 shadow-md'
                }`}
              >
                {/* Scanning Laser Beam */}
                {scanStatus === 'SCANNING' && (
                  <div
                    className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_12px_#22d3ee] rounded-full transition-all duration-200"
                    style={{ top: `${scanProgress}%` }}
                  />
                )}

                {scanStatus === 'SUCCESS' ? (
                  <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-in zoom-in-50" />
                ) : scanStatus === 'FAILED' ? (
                  <XCircle className="w-14 h-14 text-rose-400" />
                ) : (
                  <Fingerprint
                    className={`w-14 h-14 transition-colors ${
                      scanStatus === 'SCANNING' ? 'text-cyan-400 animate-pulse' : 'text-slate-400'
                    }`}
                  />
                )}
              </div>

              {/* Status Text & Diagnostics */}
              <div className="space-y-1">
                <div className="text-sm font-semibold tracking-wide">
                  {scanStatus === 'IDLE' && 'STQC Level-1 Optical Sensor Ready'}
                  {scanStatus === 'SCANNING' && 'Acquiring Ridge Flow & Minutiae...'}
                  {scanStatus === 'SUCCESS' && 'Officer Biometric Signature Verified'}
                  {scanStatus === 'FAILED' && 'Minutiae Mismatch / Incomplete Ridge Pattern'}
                </div>

                <div className="text-[11px] text-slate-400 font-mono">
                  {scanStatus === 'IDLE' && 'Click the sensor aperture above or use button below'}
                  {scanStatus === 'SCANNING' && `NFIQ Standard ISO/IEC 19794-2 • ${scanProgress}%`}
                  {scanStatus === 'SUCCESS' && (
                    <span className="text-emerald-400">
                      Quality: {qualityScore}% • Signed with Officer Private Key
                    </span>
                  )}
                  {scanStatus === 'FAILED' && (
                    <span className="text-rose-400">
                      Sensor smudged or insufficient pressure. Please retry.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* FACE ID MODE */}
          {authMode === 'FACE_ID' && (
            <div className="relative z-10 flex flex-col items-center text-center space-y-3">
              {/* Face Reticle */}
              <div
                onClick={() => scanStatus === 'IDLE' && startScan(false)}
                className={`relative w-28 h-28 rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                  scanStatus === 'SUCCESS'
                    ? 'border-emerald-400 bg-emerald-950/40 shadow-[0_0_25px_rgba(52,211,153,0.3)]'
                    : scanStatus === 'SCANNING'
                    ? 'border-purple-400 bg-purple-950/40 shadow-[0_0_20px_rgba(192,132,252,0.3)]'
                    : scanStatus === 'FAILED'
                    ? 'border-rose-400 bg-rose-950/40 shadow-[0_0_20px_rgba(251,113,133,0.3)]'
                    : 'border-slate-700 bg-slate-800/80 hover:border-slate-500 shadow-md'
                }`}
              >
                {/* Reticle Corner Guides */}
                <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-white/60" />
                <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-white/60" />
                <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-white/60" />
                <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-white/60" />

                {/* Laser Horizon */}
                {scanStatus === 'SCANNING' && (
                  <div
                    className="absolute left-1 right-1 h-0.5 bg-purple-400 shadow-[0_0_8px_#c084fc]"
                    style={{ top: `${scanProgress}%` }}
                  />
                )}

                {scanStatus === 'SUCCESS' ? (
                  <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-in zoom-in-50" />
                ) : scanStatus === 'FAILED' ? (
                  <XCircle className="w-14 h-14 text-rose-400" />
                ) : (
                  <ScanFace
                    className={`w-14 h-14 transition-colors ${
                      scanStatus === 'SCANNING' ? 'text-purple-400 animate-pulse' : 'text-slate-400'
                    }`}
                  />
                )}
              </div>

              {/* Status Text & Diagnostics */}
              <div className="space-y-1">
                <div className="text-sm font-semibold tracking-wide">
                  {scanStatus === 'IDLE' && '3D Infrared Depth Mesh Camera Ready'}
                  {scanStatus === 'SCANNING' && 'Capturing 30,000 IR Points & Liveness...'}
                  {scanStatus === 'SUCCESS' && 'Facial Liveness Authenticated'}
                  {scanStatus === 'FAILED' && 'Liveness Test Failed / Low Lighting'}
                </div>

                <div className="text-[11px] text-slate-400 font-mono">
                  {scanStatus === 'IDLE' && 'Look directly at the terminal camera'}
                  {scanStatus === 'SCANNING' && `Anti-Spoofing ISO 30107-3 • ${scanProgress}%`}
                  {scanStatus === 'SUCCESS' && (
                    <span className="text-emerald-400">
                      Liveness Score: {qualityScore}% • Micro-Expression Verified
                    </span>
                  )}
                  {scanStatus === 'FAILED' && (
                    <span className="text-rose-400">
                      Camera obstructed or facial motion blur detected.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* HARDWARE RSA TOKEN MODE */}
          {authMode === 'HARDWARE_TOKEN' && (
            <div className="relative z-10 flex flex-col items-center text-center space-y-3 w-full max-w-sm">
              <div className="p-3 bg-slate-800 rounded-full border border-slate-700">
                <KeyRound className="w-8 h-8 text-amber-400" />
              </div>

              <div>
                <div className="text-sm font-semibold">Hardware RSA SecurID Key Token</div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Fallback authorized for hardware sensor defect under RBI Disaster Recovery rules.
                </p>
              </div>

              <div className="w-full">
                <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1 text-left">
                  Enter 6-Digit Time-Based Passcode (TOTP)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.5em] font-mono text-xl py-2 px-3 bg-slate-800 border border-slate-600 rounded text-white font-bold focus:border-amber-400 focus:outline-hidden"
                  placeholder="849201"
                />
              </div>
            </div>
          )}
        </div>

        {/* Cryptographic Signature Token Details (if verified) */}
        {scanStatus === 'SUCCESS' && generatedToken && (
          <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Cryptographic Signature Token:</span>
              <span className="font-bold">{generatedToken}</span>
            </div>
            <Badge variant="success" size="sm">
              FIDO2 SIGNED
            </Badge>
          </div>
        )}

        {/* Action Controls for Testing / Simulation */}
        {authMode !== 'HARDWARE_TOKEN' && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant={scanStatus === 'SUCCESS' ? 'outline' : 'primary'}
                onClick={() => startScan(false)}
                disabled={scanStatus === 'SCANNING'}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${scanStatus === 'SCANNING' ? 'animate-spin' : ''}`} />}
              >
                {scanStatus === 'SUCCESS' ? 'Re-Scan Biometric' : 'Simulate Biometric Scan'}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => startScan(true)}
                disabled={scanStatus === 'SCANNING'}
              >
                Simulate Smudge / Reject
              </Button>
            </div>

            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <Cpu className="w-3 h-3 text-slate-400" />
              Sensor: Cogent CSD200 (STQC L1 Certified)
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
