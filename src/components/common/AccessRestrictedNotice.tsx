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
      <div className="bg-white dark:bg-[#162638] border border-slate-300 dark:border-[#33485D] rounded-lg shadow-sm max-w-lg w-full overflow-hidden">
        {/* Institutional Alert Header */}
        <div className="bg-slate-900 dark:bg-[#101C2A] text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 dark:border-[#33485D]">
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
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 dark:bg-[#1C3045] text-amber-300 border border-slate-700 dark:border-[#33485D]">
            HTTP 403 FORBIDDEN
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700 dark:text-[#A9BACB]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-700 dark:text-rose-400 shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-900 dark:text-[#E8EEF5] text-sm">
                Insufficient Privilege for {moduleName}
              </p>
              <p className="text-slate-600 dark:text-[#8194A8] leading-relaxed">
                Your authenticated profile does not possess the requisite operational entitlements to access this functional banking module.
              </p>
            </div>
          </div>

          {/* Role and Permissions Details Box */}
          <div className="bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-3 space-y-2 font-mono text-[11px]">
            <div className="flex justify-between border-b border-slate-200 dark:border-[#33485D] pb-1.5">
              <span className="text-slate-500 dark:text-[#8194A8] font-sans">Active Officer:</span>
              <span className="font-bold text-slate-900 dark:text-[#E8EEF5]">{user?.name} ({user?.employeeId})</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-[#33485D] pb-1.5">
              <span className="text-slate-500 dark:text-[#8194A8] font-sans">Assigned Role:</span>
              <span className="text-slate-900 dark:text-[#E8EEF5] font-semibold">{user?.roleName || user?.role}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-[#33485D] pb-1.5">
              <span className="text-slate-500 dark:text-[#8194A8] font-sans">Required Role(s):</span>
              <span className="text-amber-800 dark:text-amber-400 font-medium">{requiredRoles?.join(' or ') || 'Designated Supervisory Role'}</span>
            </div>
            {requiredPermission && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-[#8194A8] font-sans">Required Entitlement:</span>
                <span className="text-rose-700 dark:text-rose-400 font-semibold">{requiredPermission}</span>
              </div>
            )}
          </div>

          {/* Statutory Notice */}
          <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded p-2.5 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
            <FileWarning className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-tight">
              Under RBI Core Banking IT Governance Standards, unassigned module access is restricted to preserve segregation of duties and prevent unauthorized ledger commitment.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 dark:bg-[#101C2A] px-5 py-3 border-t border-slate-200 dark:border-[#33485D] flex items-center justify-between">
          <button
            type="button"
            onClick={onGoBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-slate-700 dark:text-[#E8EEF5] hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-[#1C3045] border border-slate-300 dark:border-[#33485D] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Operations Cockpit</span>
          </button>

          <span className="text-[10px] text-slate-400 dark:text-[#8194A8] font-mono">
            Contact Branch Admin for Entitlement Elevation
          </span>
        </div>
      </div>
    </div>
  );
};
