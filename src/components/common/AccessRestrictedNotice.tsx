import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, FileWarning, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AccessRestrictedNoticeProps {
  moduleName: string;
  requiredPermission?: string;
  requiredRoles?: string[];
  onGoBack?: () => void;
}

export const AccessRestrictedNotice: React.FC<AccessRestrictedNoticeProps> = ({
  moduleName,
  requiredPermission,
  requiredRoles,
  onGoBack,
}) => {
  const { user } = useAuth();

  return (
    <div className="min-h-[420px] flex items-center justify-center p-4 select-none">
      <div className="bg-white border border-slate-300 rounded-lg shadow-sm max-w-lg w-full overflow-hidden">
        {/* Institutional Alert Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold tracking-tight uppercase">
                Access Authorization Restricted
              </h2>
              <div className="text-[10px] text-slate-400 font-mono">
                RBAC Policy &bull; Dual-Control Gate
              </div>
            </div>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
            HTTP 403 FORBIDDEN
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-900 text-sm">
                Insufficient Privilege for {moduleName}
              </p>
              <p className="text-slate-600 leading-relaxed">
                Your authenticated profile does not possess the requisite operational entitlements to access this functional banking module.
              </p>
            </div>
          </div>

          {/* Role and Permissions Details Box */}
          <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2 font-mono text-[11px]">
            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-500 font-sans">Active Officer:</span>
              <span className="font-bold text-slate-900">{user?.name} ({user?.employeeId})</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-500 font-sans">Assigned Role:</span>
              <span className="text-slate-900 font-semibold">{user?.roleName || user?.role}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1.5">
              <span className="text-slate-500 font-sans">Required Role(s):</span>
              <span className="text-amber-800 font-medium">{requiredRoles?.join(' or ') || 'Designated Supervisory Role'}</span>
            </div>
            {requiredPermission && (
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Required Entitlement:</span>
                <span className="text-rose-700 font-semibold">{requiredPermission}</span>
              </div>
            )}
          </div>

          {/* Statutory Notice */}
          <div className="bg-amber-50/70 border border-amber-200 rounded p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
            <FileWarning className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-tight">
              Under RBI Core Banking IT Governance Standards, unassigned module access is restricted to preserve segregation of duties and prevent unauthorized ledger commitment.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onGoBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Operations Cockpit</span>
          </button>

          <span className="text-[10px] text-slate-400 font-mono">
            Contact Branch Admin for Entitlement Elevation
          </span>
        </div>
      </div>
    </div>
  );
};
