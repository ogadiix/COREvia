/**
 * COREvia Phase 39: User Detail Drawer
 * Comprehensive administrative view: identity, roles, effective permissions, scopes, sessions, and audit history.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Shield,
  CheckCircle2,
  Lock,
  Layers,
} from 'lucide-react';
import { AdminUserDetailDTO } from '../../types/admin.types';

interface UserDetailDrawerProps {
  detail: AdminUserDetailDTO | null;
  onClose: () => void;
  onStatusChangeClick: (targetStatus: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'SUSPENDED') => void;
  onResetAccessClick: () => void;
  onRevokeSessionClick: (sessionId: number) => void;
  onRevokeAllSessionsClick: () => void;
}

export const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({
  detail,
  onClose,
  onStatusChangeClick,
  onResetAccessClick,
  onRevokeSessionClick,
  onRevokeAllSessionsClick,
}) => {
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'PERMISSIONS' | 'SCOPES' | 'SESSIONS' | 'AUDIT'>('IDENTITY');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!detail) return null;

  const { identity, employment, roles, effectivePermissions, resourceScope, sessions, auditHistory } = detail;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'INACTIVE':
        return 'bg-slate-500/10 text-[#5D6B7B] dark:text-[#A9BACB] border-slate-500/30';
      case 'LOCKED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'SUSPENDED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-[#5D6B7B] dark:text-[#A9BACB] border-slate-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#FFFFFF] dark:bg-[#162638] border-l border-[#DCE3EA] dark:border-[#33485D] h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-[#DCE3EA] dark:border-[#33485D] bg-[#F8FAFC] dark:bg-[#101C2A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-[#168C83] dark:text-[#46C3B2] border border-[#168C83] dark:border-[#46C3B2]/20 flex items-center justify-center font-bold text-sm">
              {identity.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[#142C45] dark:text-[#E8EEF5] text-sm">{identity.name}</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusBadge(identity.status)}`}>
                  {identity.status}
                </span>
              </div>
              <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB]">
                {identity.employeeId} • {identity.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5] hover:bg-[#EDF1F5] dark:hover:bg-[#1E3247] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls Bar */}
        <div className="px-5 py-2.5 bg-[#F8FAFC] dark:bg-[#101C2A] border-b border-[#DCE3EA] dark:border-[#33485D] flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {identity.status !== 'ACTIVE' ? (
              <button
                onClick={() => onStatusChangeClick('ACTIVE')}
                className="px-2.5 py-1 text-[11px] font-medium rounded bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" /> Activate
              </button>
            ) : (
              <button
                onClick={() => onStatusChangeClick('INACTIVE')}
                className="px-2.5 py-1 text-[11px] font-medium rounded bg-[#DCE3EA] dark:bg-[#26394C] hover:bg-[#CBD5E1] dark:hover:bg-[#33485D] text-[#142C45] dark:text-[#E8EEF5] transition"
              >
                Deactivate
              </button>
            )}
            {identity.status !== 'SUSPENDED' && (
              <button
                onClick={() => onStatusChangeClick('SUSPENDED')}
                className="px-2.5 py-1 text-[11px] font-medium rounded bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1"
              >
                <Lock className="w-3 h-3" /> Suspend
              </button>
            )}
            <button
              onClick={onResetAccessClick}
              className="px-2.5 py-1 text-[11px] font-medium rounded bg-[#EDF1F5] dark:bg-[#101C2A] hover:bg-[#DCE3EA] dark:hover:bg-[#26394C] text-[#2D3F54] dark:text-[#CBD5E1] border border-[#CBD5E1] dark:border-[#33485D] transition"
            >
              Reset Access
            </button>
          </div>
          {sessions.some((s) => s.status === 'ACTIVE') && (
            <button
              onClick={onRevokeAllSessionsClick}
              className="px-2.5 py-1 text-[11px] font-medium rounded bg-rose-950/40 text-rose-300 border border-rose-800/60 hover:bg-rose-900/50 transition"
            >
              Revoke All Sessions
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#DCE3EA] dark:border-[#33485D] px-5 bg-[#F8FAFC] dark:bg-[#101C2A] text-xs overflow-x-auto whitespace-nowrap">
          {[
            { id: 'IDENTITY', label: 'Identity & Employment' },
            { id: 'PERMISSIONS', label: 'Effective Permissions' },
            { id: 'SCOPES', label: 'Resource Scope' },
            { id: 'SESSIONS', label: `Sessions (${sessions.filter((s) => s.status === 'ACTIVE').length})` },
            { id: 'AUDIT', label: 'Audit History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 border-b-2 font-medium transition whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'border-[#168C83] dark:border-[#46C3B2] text-[#168C83] dark:text-[#46C3B2]'
                  : 'border-transparent text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {/* TAB 1: IDENTITY */}
          {activeTab === 'IDENTITY' && (
            <div className="space-y-4">
              <div className="bg-[#F8FAFC] dark:bg-[#1E3247] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-[#142C45] dark:text-[#E8EEF5] text-xs flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#168C83] dark:text-[#46C3B2]" /> Identity Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#5D6B7B] dark:text-[#A9BACB] block text-[11px]">System UID</span>
                    <span className="font-mono text-[#142C45] dark:text-[#E8EEF5]">{identity.uid}</span>
                  </div>
                  <div>
                    <span className="text-[#5D6B7B] dark:text-[#A9BACB] block text-[11px]">Database ID</span>
                    <span className="font-mono text-[#142C45] dark:text-[#E8EEF5]">#{identity.id}</span>
                  </div>
                  <div>
                    <span className="text-[#5D6B7B] dark:text-[#A9BACB] block text-[11px]">Official Email</span>
                    <span className="text-[#142C45] dark:text-[#E8EEF5]">{identity.email}</span>
                  </div>
                  <div>
                    <span className="text-[#5D6B7B] dark:text-[#A9BACB] block text-[11px]">Employee ID</span>
                    <span className="font-mono text-[#142C45] dark:text-[#E8EEF5]">{identity.employeeId}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#F8FAFC] dark:bg-[#1E3247] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-[#142C45] dark:text-[#E8EEF5] text-xs flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#168C83] dark:text-[#46C3B2]" /> Organizational Placement
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#5D6B7B] dark:text-[#A9BACB] block text-[11px]">Department</span>
                    <span className="text-[#142C45] dark:text-[#E8EEF5]">{employment.department}</span>
                  </div>
                  <div>
                    <span className="text-[#5D6B7B] dark:text-[#A9BACB] block text-[11px]">Job Title</span>
                    <span className="text-[#142C45] dark:text-[#E8EEF5]">{employment.jobTitle}</span>
                  </div>
                  <div>
                    <span className="text-[#5D6B7B] dark:text-[#A9BACB] block text-[11px]">Reporting Manager</span>
                    <span className="text-[#142C45] dark:text-[#E8EEF5]">{employment.reportingManager}</span>
                  </div>
                  <div>
                    <span className="text-[#5D6B7B] dark:text-[#A9BACB] block text-[11px]">Assigned Branch</span>
                    <span className="text-[#142C45] dark:text-[#E8EEF5]">{employment.branchCode}</span>
                  </div>
                </div>
              </div>

              {/* Roles */}
              <div className="bg-[#F8FAFC] dark:bg-[#1E3247] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-[#142C45] dark:text-[#E8EEF5] text-xs flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#168C83] dark:text-[#46C3B2]" /> Assigned Roles
                </h4>
                {roles.map((r) => (
                  <div key={r.code} className="bg-[#F8FAFC] dark:bg-[#101C2A] p-3 rounded-lg border border-[#DCE3EA] dark:border-[#33485D]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-xs font-semibold text-[#142C45] dark:text-[#E8EEF5]">{r.code}</span>
                      <span className="text-[10px] text-[#168C83] dark:text-[#46C3B2] bg-indigo-500/10 px-2 py-0.5 rounded border border-[#168C83] dark:border-[#46C3B2]/20">
                        {r.scope}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">{r.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: EFFECTIVE PERMISSIONS */}
          {activeTab === 'PERMISSIONS' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-950/20 border border-[#168C83] dark:border-[#46C3B2]/20 rounded-lg text-[#2D3F54] dark:text-[#CBD5E1] text-xs leading-relaxed">
                <span className="font-semibold text-indigo-300 block mb-1">Calculated Permissions View</span>
                Effective permissions are derived dynamically through assigned roles and organizational policy.
                Zero duplicate permission copies are stored in accordance with institutional governance.
              </div>

              <div className="grid grid-cols-2 gap-2">
                {effectivePermissions.map((perm) => (
                  <div
                    key={perm}
                    className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#1E3247] border border-[#DCE3EA] dark:border-[#33485D] flex items-center justify-between"
                  >
                    <span className="font-mono text-[11px] text-[#2D3F54] dark:text-[#CBD5E1]">{perm}</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Granted
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: RESOURCE SCOPES */}
          {activeTab === 'SCOPES' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-lg text-amber-200 text-xs leading-relaxed">
                <span className="font-semibold text-amber-300 block mb-1">Zero Trust Resource Boundary</span>
                Role assignment grants entitlement to action types, but does not provide unrestricted access to customer records.
                Entity access remains strictly bounded by branch, RM portfolio, and departmental assignment.
              </div>

              <div className="bg-[#F8FAFC] dark:bg-[#1E3247] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-4 space-y-3">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center py-1.5 border-b border-[#CBD5E1] dark:border-[#33485D]/40">
                    <span className="text-[#5D6B7B] dark:text-[#A9BACB]">Branch Scope:</span>
                    <span className="font-medium text-[#142C45] dark:text-[#E8EEF5]">{resourceScope.branch}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-[#CBD5E1] dark:border-[#33485D]/40">
                    <span className="text-[#5D6B7B] dark:text-[#A9BACB]">Department Scope:</span>
                    <span className="font-medium text-[#142C45] dark:text-[#E8EEF5]">{resourceScope.department}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-[#CBD5E1] dark:border-[#33485D]/40">
                    <span className="text-[#5D6B7B] dark:text-[#A9BACB]">RM Portfolio:</span>
                    <span className="font-medium text-[#142C45] dark:text-[#E8EEF5]">{resourceScope.rmPortfolio || 'Not Applicable'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-[#CBD5E1] dark:border-[#33485D]/40">
                    <span className="text-[#5D6B7B] dark:text-[#A9BACB]">Customer Access Scope:</span>
                    <span className="font-mono text-[#142C45] dark:text-[#E8EEF5]">{resourceScope.customerScope}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-[#CBD5E1] dark:border-[#33485D]/40">
                    <span className="text-[#5D6B7B] dark:text-[#A9BACB]">Organization:</span>
                    <span className="font-medium text-[#142C45] dark:text-[#E8EEF5]">{resourceScope.organization}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-[#5D6B7B] dark:text-[#A9BACB]">Inherited From:</span>
                    <span className="text-[#2D3F54] dark:text-[#CBD5E1] italic">{resourceScope.inheritedFrom}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SESSIONS */}
          {activeTab === 'SESSIONS' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#5D6B7B] dark:text-[#A9BACB] text-xs">Total Sessions: {sessions.length}</span>
                <span className="text-[10px] text-[#6B7C93] dark:text-[#8194A8] italic">Tokens strictly masked</span>
              </div>
              {sessions.length === 0 ? (
                <div className="p-8 text-center text-[#6B7C93] dark:text-[#8194A8] bg-[#F8FAFC] dark:bg-[#101C2A] rounded-xl">
                  No active or past sessions found for this user.
                </div>
              ) : (
                sessions.map((s) => (
                  <div key={s.id} className="p-3 bg-[#F8FAFC] dark:bg-[#1E3247] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-[#142C45] dark:text-[#E8EEF5] text-xs">{s.sessionId}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            s.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-600/20 text-[#5D6B7B] dark:text-[#A9BACB] border-slate-600/30'
                          }`}
                        >
                          {s.status}
                        </span>
                        {s.status === 'ACTIVE' && (
                          <button
                            onClick={() => onRevokeSessionClick(s.id)}
                            className="px-2 py-0.5 text-[10px] bg-rose-600/20 text-rose-300 hover:bg-rose-600/40 rounded border border-rose-500/30 transition"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">
                      <div>Created: {new Date(s.createdAt).toLocaleString()}</div>
                      <div>Last Activity: {new Date(s.lastActivityAt).toLocaleString()}</div>
                      <div>IP: {s.ipAddress}</div>
                      <div>Agent: {s.userAgent.substring(0, 35)}...</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: AUDIT */}
          {activeTab === 'AUDIT' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#5D6B7B] dark:text-[#A9BACB] text-xs">Recent Tamper-Evident Audit Records</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  SHA-256 Chained
                </span>
              </div>
              {auditHistory.length === 0 ? (
                <div className="p-8 text-center text-[#6B7C93] dark:text-[#8194A8] bg-[#F8FAFC] dark:bg-[#101C2A] rounded-xl">
                  No audit events recorded for this user.
                </div>
              ) : (
                auditHistory.map((a) => (
                  <div key={a.id} className="p-3 bg-[#F8FAFC] dark:bg-[#1E3247] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5] text-xs">{a.action}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          a.outcome === 'SUCCESS' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                        }`}
                      >
                        {a.outcome}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">
                      <span>{new Date(a.timestamp).toLocaleString()}</span>
                      <span className="font-mono text-[10px] text-[#6B7C93] dark:text-[#8194A8]">Req: {a.requestId}</span>
                    </div>
                    <div className="text-[10px] font-mono text-[#6B7C93] dark:text-[#8194A8] truncate">
                      Hash: {a.recordHash.substring(0, 24)}...
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#DCE3EA] dark:border-[#33485D] bg-[#F8FAFC] dark:bg-[#101C2A] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#EDF1F5] dark:bg-[#101C2A] hover:bg-[#DCE3EA] dark:hover:bg-[#26394C] text-[#142C45] dark:text-[#E8EEF5] font-medium text-xs rounded-lg transition"
          >
            Close Detail
          </button>
        </div>
      </div>
    </div>
  );
};
