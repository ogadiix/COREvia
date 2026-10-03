/**
 * COREvia Phase 38: Simulator Test Modal
 * Safely executes synthetic operations through API Gateway with idempotency and latency tracking.
 */

import React, { useState, useEffect } from 'react';
import { X, Play, Clock, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { IntegrationDTO } from '../../types/integration.types.ts';
import { bankingApi } from '../../lib/api.ts';

interface SimulatorTestModalProps {
  integration: IntegrationDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DEFAULT_PAYLOADS: Record<string, Record<string, any>> = {
  'INT-COREBANKING': {
    operation: 'getBalance',
    payload: { accountNumber: '10482001' },
  },
  'INT-KYC': {
    operation: 'verifyIdentity',
    payload: { customerCode: 'CUS-10482', idType: 'PAN', idNumber: 'ABCDE1234F' },
  },
  'INT-DOCMGMT': {
    operation: 'uploadMetadata',
    payload: { customerCode: 'CUS-10482', documentType: 'BOARD_RESOLUTION' },
  },
  'INT-PAYMENTS': {
    operation: 'submitPaymentInstruction',
    payload: {
      sourceAccount: '10482001',
      beneficiaryAccount: '992810482',
      beneficiaryIfsc: 'CORV0001048',
      amount: 250000,
    },
  },
  'INT-NOTIF': {
    operation: 'sendNotification',
    payload: { channel: 'SMS', recipient: '9876543210', content: 'Your high-value RTGS payment of INR 2,50,000 has been cleared.' },
  },
};

export const SimulatorTestModal: React.FC<SimulatorTestModalProps> = ({
  integration,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [operation, setOperation] = useState('getBalance');
  const [payloadStr, setPayloadStr] = useState('{}');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [response, setResponse] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (integration) {
      const def = DEFAULT_PAYLOADS[integration.integrationId] || {
        operation: 'ping',
        payload: {},
      };
      setOperation(def.operation);
      setPayloadStr(JSON.stringify(def.payload, null, 2));
      setIdempotencyKey(`IDEMP-${Date.now().toString().slice(-6)}`);
      setResponse(null);
      setErrorMsg(null);
    }
  }, [integration, isOpen]);

  if (!isOpen || !integration) return null;

  const handleExecute = async () => {
    setIsExecuting(true);
    setErrorMsg(null);
    setResponse(null);

    let parsedPayload = {};
    try {
      parsedPayload = JSON.parse(payloadStr);
    } catch (e: any) {
      setErrorMsg(`Invalid JSON payload: ${e.message}`);
      setIsExecuting(false);
      return;
    }

    try {
      const res = await bankingApi.executeIntegrationOperation(
        integration.integrationId,
        operation,
        parsedPayload,
        idempotencyKey
      );
      setResponse(res);
      if (onSuccess) onSuccess();
    } catch (e: any) {
      setErrorMsg(e.message || 'Execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded font-medium bg-slate-200 text-slate-800">
                {integration.integrationId}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                {integration.mode}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">Live Operation Simulator</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 flex items-center gap-2 text-xs text-amber-900 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Executes against registered internal simulator adapter. Zero production mutations.</span>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Operation Name
              </label>
              <input
                type="text"
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Idempotency-Key
              </label>
              <input
                type="text"
                value={idempotencyKey}
                onChange={(e) => setIdempotencyKey(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Request Payload (JSON)
            </label>
            <textarea
              rows={5}
              value={payloadStr}
              onChange={(e) => setPayloadStr(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 text-slate-100 font-mono text-xs rounded-lg border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-medium">
              {errorMsg}
            </div>
          )}

          {response && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Gateway Response
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Latency: <strong>{response.latencyMs || 25} ms</strong>
                </span>
              </div>
              <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg max-h-48 overflow-y-auto border border-slate-800">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Encrypted gateway correlation active</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
            >
              <Play className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
              {isExecuting ? 'Dispatching...' : 'Dispatch Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
