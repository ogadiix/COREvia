/**
 * COREvia Phase 39: Enterprise Administration & Governance Center
 * Institutional control plane covering:
 * - Overview
 * - Users & User Detail Drawer
 * - Roles & Permissions (15 domains)
 * - Access Scopes (Branch, Dept, RM, Customer, Org)
 * - Sessions (Revocation, multi-session termination)
 * - Login Activity & Security Events
 * - AI & Copilot Governance
 * - Integrations
 * - Notifications & SLA
 * - Feature Flags (Governed toggle)
 * - System Configuration & Database Health
 * - Background Jobs
 * - Maintenance Mode
 * - Audit Center & Tamper-Evident SHA-256 Chaining
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Users,
  Key,
  Globe,
  Activity,
  AlertTriangle,
  Bot,
  Layers,
  Bell,
  Clock,
  Flag,
  Server,
  Terminal,
  FileCheck,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Eye,
  Lock,
  Unlock,
  AlertOctagon,
  ExternalLink,
  ChevronRight,
  Database,
  Sliders,
  Filter,
  Sun,
  Moon,
  Monitor,
  Settings,
  UserCheck,
  Smartphone,
  Sparkles,
  Laptop,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  AdminOverviewDTO,
  AdminUserDTO,
  AdminUserDetailDTO,
  AdminRoleDTO,
  AdminPermissionDTO,
  AdminSessionDTO,
  LoginActivityDTO,
  SecurityEventDTO,
  AdminAiGovernanceDTO,
  AdminIntegrationSummaryDTO,
  NotificationPolicyDTO,
  SlaPolicyDTO,
  FeatureFlagDTO,
  SystemConfigDTO,
  DatabaseHealthDTO,
  BackgroundJobDTO,
  MaintenanceModeConfigDTO,
  AuditTrailItemDTO,
} from '../../types/admin.types';
import { UserDetailDrawer } from './UserDetailDrawer';
import { SecurityEventDetailDrawer } from './SecurityEventDetailDrawer';
import { AdminConfirmModal } from './AdminConfirmModal';
import { EmptyState } from '../common/EmptyState';
import { useToast } from '../common/Toast';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { useTheme } from '../../context/ThemeContext';

type AdminTab =
  | 'overview'
  | 'preferences'
  | 'users'
  | 'roles'
  | 'scopes'
  | 'sessions'
  | 'security'
  | 'ai'
  | 'integrations'
  | 'notifications'
  | 'sla'
  | 'flags'
  | 'system'
  | 'jobs'
  | 'audit';

export const AdminWorkspace: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  // Active section
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Loading & error state
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [overview, setOverview] = useState<AdminOverviewDTO | null>(null);
  const [usersList, setUsersList] = useState<AdminUserDTO[]>([]);
  const [usersTotal, setUsersTotal] = useState<number>(0);
  const [userSearch, setUserSearch] = useState<string>('');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('ALL');
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetailDTO | null>(null);

  const [roles, setRoles] = useState<AdminRoleDTO[]>([]);
  const [permissions, setPermissions] = useState<AdminPermissionDTO[]>([]);
  const [sessions, setSessions] = useState<AdminSessionDTO[]>([]);
  const [loginActivity, setLoginActivity] = useState<LoginActivityDTO[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEventDTO[]>([]);
  const [selectedSecurityEvent, setSelectedSecurityEvent] = useState<SecurityEventDTO | null>(null);
  const [secEventFilter, setSecEventFilter] = useState<string>('ALL');

  const [aiGovernance, setAiGovernance] = useState<AdminAiGovernanceDTO | null>(null);
  const [integrationsSummary, setIntegrationsSummary] = useState<AdminIntegrationSummaryDTO[]>([]);
  const [notificationPolicies, setNotificationPolicies] = useState<NotificationPolicyDTO[]>([]);
  const [slaPolicies, setSlaPolicies] = useState<SlaPolicyDTO[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagDTO[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfigDTO | null>(null);
  const [dbHealth, setDbHealth] = useState<DatabaseHealthDTO | null>(null);
  const [backgroundJobs, setBackgroundJobs] = useState<BackgroundJobDTO[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState<MaintenanceModeConfigDTO | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditTrailItemDTO[]>([]);
  const [auditIntegrity, setAuditIntegrity] = useState<{ verified: boolean; checkedCount: number; status: string } | null>(null);
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');

  // Confirmation Modal state
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    actionName: string;
    targetDescription: string;
    impactDescription: string;
    confirmButtonLabel?: string;
    isDangerous?: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    actionName: '',
    targetDescription: '',
    impactDescription: '',
    onConfirm: async () => {},
  });
  const [modalExecuting, setModalExecuting] = useState(false);

  // Initial fetch
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verify Admin privileges
      if (user?.role !== 'ADMINISTRATOR') {
        setActiveTab('preferences');
        setLoading(false);
        return;
      }

      const [
        ovRes,
        uRes,
        rRes,
        pRes,
        sRes,
        logRes,
        secRes,
        aiRes,
        intRes,
        notifRes,
        slaRes,
        ffRes,
        sysRes,
        dbRes,
        jobRes,
        maintRes,
        audRes,
        audIntRes,
      ] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminUsers(),
        api.getAdminRoles(),
        api.getAdminPermissions(),
        api.getAdminSessions(),
        api.getAdminLoginActivity(),
        api.getAdminSecurityEvents(),
        api.getAdminAiGovernance(),
        api.getAdminIntegrationsSummary(),
        api.getAdminNotifications(),
        api.getAdminSla(),
        api.getAdminFeatureFlags(),
        api.getAdminSystemConfig(),
        api.getAdminDatabaseHealth(),
        api.getAdminBackgroundJobs(),
        api.getAdminMaintenanceMode(),
        api.getAdminAuditTrail(),
        api.verifyAdminAuditIntegrity(),
      ]);

      if (ovRes.success) setOverview(ovRes.data);
      if (uRes.success) {
        setUsersList(uRes.data);
        setUsersTotal(uRes.total);
      }
      if (rRes.success) setRoles(rRes.data);
      if (pRes.success) setPermissions(pRes.data);
      if (sRes.success) setSessions(sRes.data);
      if (logRes.success) setLoginActivity(logRes.data);
      if (secRes.success) setSecurityEvents(secRes.data);
      if (aiRes.success) setAiGovernance(aiRes.data);
      if (intRes.success) setIntegrationsSummary(intRes.data);
      if (notifRes.success) setNotificationPolicies(notifRes.data);
      if (slaRes.success) setSlaPolicies(slaRes.data);
      if (ffRes.success) setFeatureFlags(ffRes.data);
      if (sysRes.success) setSystemConfig(sysRes.data);
      if (dbRes.success) setDbHealth(dbRes.data);
      if (jobRes.success) setBackgroundJobs(jobRes.data);
      if (maintRes.success) setMaintenanceMode(maintRes.data);
      if (audRes.success) setAuditLogs(audRes.data);
      if (audIntRes.success) setAuditIntegrity(audIntRes.data);
    } catch (err: any) {
      console.error('Failed to load admin workspace data:', err);
      setError(err.message || 'Failed to initialize administrative control plane.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
  };

  // User Actions
  const handleOpenUserDetail = async (userId: number) => {
    try {
      const res = await api.getAdminUserDetail(userId);
      if (res.success) {
        setSelectedUserDetail(res.data);
      }
    } catch (err: any) {
      toast.error(`Error loading user details: ${err.message}`);
    }
  };

  const promptStatusChange = (targetUser: AdminUserDTO, targetStatus: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'SUSPENDED') => {
    setConfirmModalState({
      isOpen: true,
      title: `${targetStatus === 'ACTIVE' ? 'Activate' : 'Restrict'} User Account`,
      actionName: `STATUS_TRANSITION -> ${targetStatus}`,
      targetDescription: `${targetUser.name} (${targetUser.employeeId})`,
      impactDescription:
        targetStatus === 'ACTIVE'
          ? 'Re-enables access to COREvia core banking modules. User can authenticate immediately.'
          : 'Immediately revokes all active PostgreSQL sessions and terminates existing access tokens.',
      confirmButtonLabel: `Confirm Transition to ${targetStatus}`,
      isDangerous: targetStatus !== 'ACTIVE',
      onConfirm: async () => {
        setModalExecuting(true);
        try {
          await api.updateAdminUserStatus(targetUser.id, targetStatus, `Administrative transition to ${targetStatus}`);
          setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
          toast.success(`User ${targetUser.name} status updated to ${targetStatus}`);
          await loadAllData();
          if (selectedUserDetail?.identity.id === targetUser.id) {
            await handleOpenUserDetail(targetUser.id);
          }
        } catch (err: any) {
          toast.error(`Failed to update status: ${err.message}`);
        } finally {
          setModalExecuting(false);
        }
      },
    });
  };

  const promptResetAccess = (targetUser: AdminUserDTO) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Reset User Access & Sessions',
      actionName: 'CREDENTIAL_RESET_AND_SESSION_PURGE',
      targetDescription: `${targetUser.name} (${targetUser.employeeId})`,
      impactDescription: 'Clears all existing session tokens, resets account lock counters, and issues an access audit event.',
      confirmButtonLabel: 'Confirm Reset Access',
      isDangerous: true,
      onConfirm: async () => {
        setModalExecuting(true);
        try {
          await api.resetAdminUserAccess(targetUser.id, 'Administrative access credential reset');
          setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
          toast.success(`Access credentials reset for ${targetUser.name}`);
          await loadAllData();
        } catch (err: any) {
          toast.error(`Failed to reset access: ${err.message}`);
        } finally {
          setModalExecuting(false);
        }
      },
    });
  };

  const promptRevokeSession = (sessionId: number) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Revoke Authentication Session',
      actionName: 'SESSION_REVOCATION',
      targetDescription: `Session #${sessionId}`,
      impactDescription: 'The user will be immediately logged out and required to re-authenticate with their credentials.',
      confirmButtonLabel: 'Revoke Session',
      isDangerous: true,
      onConfirm: async () => {
        setModalExecuting(true);
        try {
          await api.revokeAdminSession(sessionId, 'Administrative manual session revocation');
          setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
          toast.success(`Session #${sessionId} revoked`);
          await loadAllData();
          if (selectedUserDetail) {
            await handleOpenUserDetail(selectedUserDetail.identity.id);
          }
        } catch (err: any) {
          toast.error(`Failed to revoke session: ${err.message}`);
        } finally {
          setModalExecuting(false);
        }
      },
    });
  };

  const promptRevokeAllSessions = (userId: number, userName: string) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Terminate All User Sessions',
      actionName: 'BULK_SESSION_REVOCATION',
      targetDescription: `All sessions for ${userName} (ID #${userId})`,
      impactDescription: 'Terminates all active logins across browsers and mobile terminals for this principal.',
      confirmButtonLabel: 'Terminate All Sessions',
      isDangerous: true,
      onConfirm: async () => {
        setModalExecuting(true);
        try {
          await api.revokeAllAdminSessionsForUser(userId, 'Administrative bulk session termination');
          setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
          toast.success(`All sessions terminated for ${userName}`);
          await loadAllData();
          if (selectedUserDetail) {
            await handleOpenUserDetail(userId);
          }
        } catch (err: any) {
          toast.error(`Failed to revoke sessions: ${err.message}`);
        } finally {
          setModalExecuting(false);
        }
      },
    });
  };

  const promptToggleFeatureFlag = (flag: FeatureFlagDTO) => {
    const nextState = !flag.enabled;
    setConfirmModalState({
      isOpen: true,
      title: `${nextState ? 'Enable' : 'Disable'} Governed Feature Flag`,
      actionName: `FEATURE_FLAG_MUTATION -> ${flag.flagKey}`,
      targetDescription: `${flag.flagKey} (${flag.name})`,
      impactDescription: nextState
        ? `Enables ${flag.name} across the ${flag.environment} environment.`
        : `Disables ${flag.name}. Invariant enforced: feature flags cannot disable authentication, authorization, or audit logging.`,
      confirmButtonLabel: `Set to ${nextState ? 'ENABLED' : 'DISABLED'}`,
      isDangerous: !nextState,
      onConfirm: async () => {
        setModalExecuting(true);
        try {
          await api.toggleAdminFeatureFlag(flag.flagKey, nextState, `Administrative toggle to ${nextState}`);
          setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
          toast.success(`Feature flag ${flag.flagKey} set to ${nextState ? 'ENABLED' : 'DISABLED'}`);
          await loadAllData();
        } catch (err: any) {
          toast.error(`Failed to toggle feature flag: ${err.message}`);
        } finally {
          setModalExecuting(false);
        }
      },
    });
  };

  const promptToggleMaintenanceMode = () => {
    const nextState = !maintenanceMode?.active;
    setConfirmModalState({
      isOpen: true,
      title: `${nextState ? 'Activate' : 'Deactivate'} Maintenance Mode`,
      actionName: 'SYSTEM_MAINTENANCE_TOGGLE',
      targetDescription: 'COREvia Core Banking System State',
      impactDescription: nextState
        ? 'Defers non-administrative traffic. Notice: Administrators maintain complete control-plane access; you will NOT be locked out.'
        : 'Restores regular transactional and user operations.',
      confirmButtonLabel: nextState ? 'Activate Maintenance' : 'Restore Normal Operations',
      isDangerous: true,
      onConfirm: async () => {
        setModalExecuting(true);
        try {
          await api.setAdminMaintenanceMode(
            nextState,
            nextState ? 'Scheduled system configuration and index maintenance' : 'Maintenance complete',
            60
          );
          setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
          toast.success(`System maintenance mode ${nextState ? 'ACTIVATED' : 'DEACTIVATED'}`);
          await loadAllData();
        } catch (err: any) {
          toast.error(`Failed to toggle maintenance mode: ${err.message}`);
        } finally {
          setModalExecuting(false);
        }
      },
    });
  };

  // Filtered lists
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchSearch =
        userSearch.trim() === '' ||
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.employeeId.toLowerCase().includes(userSearch.toLowerCase());
      const matchStatus = userStatusFilter === 'ALL' || u.status === userStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [usersList, userSearch, userStatusFilter]);

  const filteredSecEvents = useMemo(() => {
    return securityEvents.filter((e) => {
      if (secEventFilter === 'ALL') return true;
      return e.severity === secEventFilter;
    });
  }, [securityEvents, secEventFilter]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((a) => {
      if (auditActionFilter === 'ALL') return true;
      return a.action === auditActionFilter;
    });
  }, [auditLogs, auditActionFilter]);

  const isPrivilegedAdmin = user?.role === 'ADMINISTRATOR';

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#168C83] dark:border-[#46C3B2] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] tracking-wide uppercase">Initializing Administrative Control Plane...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#DCE3EA] dark:border-[#33485D]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#168C83]/10 text-[#168C83] dark:text-[#46C3B2] border border-[#168C83]/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#142C45] dark:text-[#E8EEF5] tracking-tight">
                  Enterprise Administration & Governance Center
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#168C83]/10 text-[#168C83] dark:text-[#46C3B2] border border-[#168C83]/30">
                  /admin
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  RBAC ENFORCED
                </span>
                {maintenanceMode?.active && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> MAINTENANCE MODE
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] mt-0.5">
                Centralized Institutional Control Plane • Security, RBAC, Governance & Telemetry
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-lg bg-[#EDF1F5] dark:bg-[#1E3247] hover:bg-[#EDF1F5] dark:hover:bg-[#26394C] text-[#142C45] dark:text-[#E8EEF5] border border-[#CBD5E1] dark:border-[#33485D] text-xs font-medium flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Control Plane
          </button>
        </div>
      </div>

      {/* Control Plane Navigation Tabs */}
      <div className="flex gap-1.5 border-b border-[#DCE3EA] dark:border-[#33485D] overflow-x-auto pb-2 text-xs">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'users', label: `Users (${usersTotal})`, icon: Users },
          { id: 'roles', label: `Roles & Perms (${roles.length})`, icon: Key },
          { id: 'scopes', label: 'Access Scopes', icon: Globe },
          { id: 'sessions', label: `Sessions (${sessions.length})`, icon: Clock },
          { id: 'security', label: `Security (${securityEvents.length})`, icon: AlertTriangle },
          { id: 'ai', label: 'AI Governance', icon: Bot },
          { id: 'integrations', label: 'Integrations', icon: Layers },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'sla', label: 'SLA & Ops', icon: Sliders },
          { id: 'flags', label: `Feature Flags (${featureFlags.length})`, icon: Flag },
          { id: 'system', label: 'System & DB', icon: Server },
          { id: 'jobs', label: `Jobs (${backgroundJobs.length})`, icon: Terminal },
          { id: 'audit', label: 'Audit Center', icon: FileCheck },
          { id: 'preferences', label: 'Preferences & Settings', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-3 py-2 rounded-lg font-medium flex items-center gap-1.5 whitespace-nowrap transition ${
                isActive
                  ? 'bg-[#168C83] text-white shadow-sm'
                  : 'text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5] hover:bg-[#F8FAFC] dark:hover:bg-[#1E3247]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Non-Admin Notice for Restricted Administrative Tabs */}
      {!isPrivilegedAdmin && activeTab !== 'preferences' && (
        <div className="p-8 rounded-xl bg-[#FFFFFF] dark:bg-[#162638] border border-amber-500/40 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#142C45] dark:text-[#E8EEF5]">
              Privileged Administrative Control Plane
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold tracking-wide uppercase mt-0.5">
              Role-Based Access Control Enforced
            </p>
          </div>
          <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] max-w-lg mx-auto leading-relaxed">
            This administrative domain requires <strong className="text-[#142C45] dark:text-[#E8EEF5]">ADMINISTRATOR</strong> credentials.
            Your authenticated principal is <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5]">{user?.name}</span> with role <span className="font-mono text-amber-600 dark:text-amber-400">{user?.role}</span>.
          </p>
          <div>
            <button
              onClick={() => setActiveTab('preferences')}
              className="px-4 py-2 bg-[#168C83] hover:bg-[#127069] text-white rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
            >
              Open Personal Preferences & Workstation Settings
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. OVERVIEW TAB */}
      {/* ========================================================================= */}
      {isPrivilegedAdmin && activeTab === 'overview' && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-1">
              <span className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider font-semibold">Active Users</span>
              <div className="text-2xl font-bold text-[#142C45] dark:text-[#E8EEF5]">{overview.activeUsers}</div>
              <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">Total Provisioned: {overview.totalUsers}</span>
            </div>
            <div className="p-4 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-1">
              <span className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider font-semibold">Active Sessions</span>
              <div className="text-2xl font-bold text-[#168C83] dark:text-[#46C3B2]">{overview.activeSessions}</div>
              <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">Server-Side PostgreSQL</span>
            </div>
            <div className="p-4 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-1">
              <span className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider font-semibold">Security Events</span>
              <div className="text-2xl font-bold text-amber-400">{overview.securityEvents}</div>
              <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">Auth Failures: {overview.failedLoginAttempts}</span>
            </div>
            <div className="p-4 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-1">
              <span className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider font-semibold">Feature Flags</span>
              <div className="text-2xl font-bold text-emerald-400">
                {overview.enabledFeatureFlags} / {overview.totalFeatureFlags}
              </div>
              <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">Governed Controls</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-[#2D3F54] dark:text-[#CBD5E1]">Open Governance Exceptions</span>
                <span className="font-mono text-sm font-bold text-rose-400">{overview.openGovernanceExceptions}</span>
              </div>
              <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">Policy anomalies requiring compliance review.</p>
            </div>
            <div className="p-4 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-[#2D3F54] dark:text-[#CBD5E1]">Active Integrations</span>
                <span className="font-mono text-sm font-bold text-emerald-400">
                  {overview.activeIntegrations} ({overview.failedIntegrations} Failed)
                </span>
              </div>
              <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">Enterprise API adapters and payment simulators.</p>
            </div>
            <div className="p-4 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-[#2D3F54] dark:text-[#CBD5E1]">Background Job Queues</span>
                <span className="font-mono text-sm font-bold text-blue-400">
                  {overview.runningJobs} Running / {overview.failedJobs} Failed
                </span>
              </div>
              <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">Automated SLA monitors & session purge workers.</p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-[#142C45] dark:text-[#E8EEF5] uppercase tracking-wider mb-3">
              Administrative Control Centers
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <button
                onClick={() => setActiveTab('users')}
                className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#1E3247] hover:bg-[#EDF1F5] dark:hover:bg-[#26394C] border border-[#DCE3EA] dark:border-[#33485D] text-left transition"
              >
                <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5] block mb-0.5">User Management</span>
                <span className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">Personnel, status, and credentials</span>
              </button>
              <button
                onClick={() => setActiveTab('roles')}
                className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#1E3247] hover:bg-[#EDF1F5] dark:hover:bg-[#26394C] border border-[#DCE3EA] dark:border-[#33485D] text-left transition"
              >
                <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5] block mb-0.5">RBAC & Permissions</span>
                <span className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">15 enterprise domain matrices</span>
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#1E3247] hover:bg-[#EDF1F5] dark:hover:bg-[#26394C] border border-[#DCE3EA] dark:border-[#33485D] text-left transition"
              >
                <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5] block mb-0.5">Security Events</span>
                <span className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">IDOR, CSRF, and secret access traces</span>
              </button>
              <button
                onClick={() => setActiveTab('flags')}
                className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#1E3247] hover:bg-[#EDF1F5] dark:hover:bg-[#26394C] border border-[#DCE3EA] dark:border-[#33485D] text-left transition"
              >
                <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5] block mb-0.5">Feature Flags</span>
                <span className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">Governed environment switches</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. USERS TAB */}
      {/* ========================================================================= */}
      {isPrivilegedAdmin && activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-[#FFFFFF] dark:bg-[#162638] p-3 rounded-xl border border-[#DCE3EA] dark:border-[#33485D] text-xs">
            <div className="flex items-center gap-2 w-full sm:w-80 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 text-[#5D6B7B] dark:text-[#A9BACB]" />
              <input
                type="text"
                placeholder="Search user, email, employee ID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#142C45] dark:text-[#E8EEF5] placeholder-slate-500 focus:outline-none focus:border-[#168C83] dark:border-[#46C3B2]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[#5D6B7B] dark:text-[#A9BACB] text-[11px]">Status:</span>
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg px-2.5 py-1.5 text-xs text-[#2D3F54] dark:text-[#CBD5E1] focus:outline-none focus:border-[#168C83] dark:border-[#46C3B2]"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="LOCKED">LOCKED</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>

          {/* Compact Institutional Table */}
          <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] dark:bg-[#101C2A] border-b border-[#DCE3EA] dark:border-[#33485D] text-[#5D6B7B] dark:text-[#A9BACB] uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3EA] dark:divide-[#33485D]/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center">
                      <EmptyState
                        compact
                        icon={<Users className="w-5 h-5 text-[#168C83] dark:text-[#46C3B2]" />}
                        title="No personnel accounts found"
                        description="No provisioned users match the active search criteria or status filter."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#1E3247] transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#142C45] dark:text-[#E8EEF5]">{u.name}</div>
                      <div className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] font-mono">{u.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#2D3F54] dark:text-[#CBD5E1]">{u.employeeId}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-[#168C83]/30 font-mono">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#2D3F54] dark:text-[#CBD5E1]">{u.department}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : u.status === 'SUSPENDED'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-[#EDF1F5] dark:bg-[#26394C]/40 text-[#5D6B7B] dark:text-[#A9BACB] border-slate-600/40'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#5D6B7B] dark:text-[#A9BACB] text-[11px]">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenUserDetail(u.id)}
                          className="px-2.5 py-1 bg-[#EDF1F5] dark:bg-[#1E3247] hover:bg-[#EDF1F5] dark:hover:bg-[#26394C] text-[#142C45] dark:text-[#E8EEF5] rounded font-medium text-[11px] transition flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                        {u.status === 'ACTIVE' ? (
                          <button
                            onClick={() => promptStatusChange(u, 'INACTIVE')}
                            className="px-2 py-1 bg-[#EDF1F5] dark:bg-[#1E3247] hover:bg-[#EDF1F5] dark:hover:bg-[#26394C] text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5] rounded text-[11px] transition"
                            title="Deactivate account"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => promptStatusChange(u, 'ACTIVE')}
                            className="px-2 py-1 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-700/50 rounded text-[11px] transition"
                            title="Activate account"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          onClick={() => promptResetAccess(u)}
                          className="px-2 py-1 bg-[#EDF1F5] dark:bg-[#1E3247] hover:bg-[#EDF1F5] dark:hover:bg-[#26394C] text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5] rounded text-[11px] transition"
                          title="Reset access"
                        >
                          Reset
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ROLES & PERMISSIONS TAB */}
      {/* ========================================================================= */}
      {isPrivilegedAdmin && activeTab === 'roles' && (
        <div className="space-y-6 text-xs">
          {/* Roles Summary Grid */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[#142C45] dark:text-[#E8EEF5] text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#168C83] dark:text-[#46C3B2]" />
              Configured Institutional Roles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {roles.map((r) => (
                <div key={r.code} className="p-4 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-[#142C45] dark:text-[#E8EEF5] text-xs">{r.code}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#168C83]/10 text-[#168C83] dark:text-[#46C3B2] border border-[#168C83]/30">
                      {r.userCount} Users
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">{r.description}</p>
                  <div className="pt-2 border-t border-[#DCE3EA] dark:border-[#33485D] flex justify-between items-center text-[10px] text-[#6B7C93] dark:text-[#8194A8] font-mono">
                    <span>Scope: {r.scope}</span>
                    <span>{r.permissionCount} Perms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 15 Domains Permissions Matrix */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-[#142C45] dark:text-[#E8EEF5] text-sm flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                Permissions Matrix Across 15 Enterprise Domains
              </h3>
              <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] bg-[#EDF1F5] dark:bg-[#1E3247] px-2 py-1 rounded">
                Read-Only Inspection (Client Escalation Forbidden)
              </span>
            </div>
            <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] dark:bg-[#101C2A] border-b border-[#DCE3EA] dark:border-[#33485D] text-[#5D6B7B] dark:text-[#A9BACB] uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Permission Code</th>
                    <th className="py-3 px-4">Domain</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4">Assigned Roles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE3EA] dark:divide-[#33485D]/60">
                  {permissions.map((p) => (
                    <tr key={p.code} className="hover:bg-[#F8FAFC] dark:hover:bg-[#1E3247] transition">
                      <td className="py-3 px-4 font-mono font-semibold text-[#142C45] dark:text-[#E8EEF5]">{p.code}</td>
                      <td className="py-3 px-4 font-mono text-[10px] text-[#168C83] dark:text-[#46C3B2] font-semibold">{p.domain}</td>
                      <td className="py-3 px-4 text-[#2D3F54] dark:text-[#CBD5E1]">{p.description}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            p.riskLevel === 'CRITICAL'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : p.riskLevel === 'HIGH'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-[#EDF1F5] dark:bg-[#1E3247] text-[#2D3F54] dark:text-[#CBD5E1] border-[#CBD5E1] dark:border-[#33485D]'
                          }`}
                        >
                          {p.riskLevel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {p.assignedRoles.map((role) => (
                            <span
                              key={role}
                              className="px-1.5 py-0.5 rounded text-[9px] bg-[#EDF1F5] dark:bg-[#1E3247] text-[#2D3F54] dark:text-[#CBD5E1] font-mono"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ACCESS SCOPES TAB */}
      {/* ========================================================================= */}
      {isPrivilegedAdmin && activeTab === 'scopes' && (
        <div className="space-y-6 text-xs">
          <div className="p-4 bg-indigo-950/20 border border-[#168C83]/30 rounded-xl space-y-2">
            <h3 className="font-semibold text-indigo-300 text-sm flex items-center gap-2">
              <Globe className="w-4 h-4" /> Core Institutional Rule: Role Access ≠ Unrestricted Entity Access
            </h3>
            <p className="text-[#2D3F54] dark:text-[#CBD5E1] leading-relaxed text-xs">
              In COREvia, holding an administrative or officer role does not grant automatic access to every customer or transaction.
              Every request is dynamically filtered through five orthogonal resource scope dimensions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-2">
              <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5] block text-xs">1. Branch Scope</span>
              <p className="text-[#5D6B7B] dark:text-[#A9BACB] text-[11px] leading-relaxed">
                Officers are confined to accounts held at their assigned branch unless elevated to regional oversight.
              </p>
              <div className="p-2 bg-[#F8FAFC] dark:bg-[#101C2A] rounded font-mono text-[10px] text-[#2D3F54] dark:text-[#CBD5E1]">
                Scope Key: BR-001 (Mumbai Nariman Point)
              </div>
            </div>
            <div className="p-4 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-2">
              <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5] block text-xs">2. RM Portfolio Scope</span>
              <p className="text-[#5D6B7B] dark:text-[#A9BACB] text-[11px] leading-relaxed">
                Relationship Managers only see the commercial clients explicitly mapped to their portfolio.
              </p>
              <div className="p-2 bg-[#F8FAFC] dark:bg-[#101C2A] rounded font-mono text-[10px] text-[#2D3F54] dark:text-[#CBD5E1]">
                Scope Key: RM-PORTFOLIO-25
              </div>
            </div>
            <div className="p-4 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-2">
              <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5] block text-xs">3. Departmental Scope</span>
              <p className="text-[#5D6B7B] dark:text-[#A9BACB] text-[11px] leading-relaxed">
                Branch Operations, Risk & Compliance, and Treasury maintain strict data segregation.
              </p>
              <div className="p-2 bg-[#F8FAFC] dark:bg-[#101C2A] rounded font-mono text-[10px] text-[#2D3F54] dark:text-[#CBD5E1]">
                Scope Key: DEPT-BRANCH-OPS
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SESSIONS TAB */}
      {/* ========================================================================= */}
      {isPrivilegedAdmin && activeTab === 'sessions' && (
        <div className="space-y-4 text-xs">
          <div className="flex justify-between items-center bg-[#FFFFFF] dark:bg-[#162638] p-3 rounded-xl border border-[#DCE3EA] dark:border-[#33485D]">
            <div>
              <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5] text-xs">Active Session Management</span>
              <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">Tokens are securely hashed in PostgreSQL; secrets are never disclosed.</p>
            </div>
            <span className="font-mono text-xs text-[#168C83] dark:text-[#46C3B2] bg-indigo-500/10 px-2 py-1 rounded border border-[#168C83]/30">
              {sessions.filter((s) => s.status === 'ACTIVE').length} Active Principal Sessions
            </span>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] dark:bg-[#101C2A] border-b border-[#DCE3EA] dark:border-[#33485D] text-[#5D6B7B] dark:text-[#A9BACB] uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Session ID</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">IP Metadata</th>
                  <th className="py-3 px-4">Client Agent</th>
                  <th className="py-3 px-4">Expires At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3EA] dark:divide-[#33485D]/60">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#1E3247] transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#142C45] dark:text-[#E8EEF5]">{s.sessionId}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#142C45] dark:text-[#E8EEF5]">{s.userName}</div>
                      <div className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] font-mono">{s.userRole}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#2D3F54] dark:text-[#CBD5E1]">{s.ipAddress}</td>
                    <td className="py-3 px-4 text-[#5D6B7B] dark:text-[#A9BACB] text-[11px] max-w-xs truncate" title={s.userAgent}>
                      {s.userAgent}
                    </td>
                    <td className="py-3 px-4 text-[#5D6B7B] dark:text-[#A9BACB] text-[11px]">{new Date(s.expiresAt).toLocaleTimeString()}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          s.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-[#EDF1F5] dark:bg-[#1E3247] text-[#6B7C93] dark:text-[#8194A8] border-[#CBD5E1] dark:border-[#33485D]'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {s.status === 'ACTIVE' && (
                        <button
                          onClick={() => promptRevokeSession(s.id)}
                          className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 rounded font-medium text-[11px] transition"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SECURITY EVENTS TAB */}
      {/* ========================================================================= */}
      {isPrivilegedAdmin && activeTab === 'security' && (
        <div className="space-y-4 text-xs">
          <div className="flex justify-between items-center bg-[#FFFFFF] dark:bg-[#162638] p-3 rounded-xl border border-[#DCE3EA] dark:border-[#33485D]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5] text-xs">Security Event Ledger</span>
              <select
                value={secEventFilter}
                onChange={(e) => setSecEventFilter(e.target.value)}
                className="bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg px-2.5 py-1 text-xs text-[#2D3F54] dark:text-[#CBD5E1] focus:outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
            <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">IDOR, Auth, and Secret Violation Interceptions</span>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] dark:bg-[#101C2A] border-b border-[#DCE3EA] dark:border-[#33485D] text-[#5D6B7B] dark:text-[#A9BACB] uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target Resource</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3EA] dark:divide-[#33485D]/60">
                {filteredSecEvents.map((e) => (
                  <tr key={e.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#1E3247] transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#142C45] dark:text-[#E8EEF5]">{e.eventId}</td>
                    <td className="py-3 px-4 font-semibold text-[#2D3F54] dark:text-[#CBD5E1]">{e.type}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          e.severity === 'CRITICAL'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : e.severity === 'HIGH'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}
                      >
                        {e.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#142C45] dark:text-[#E8EEF5]">{e.actorName}</div>
                      <div className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] font-mono">ID: {e.actorId}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#2D3F54] dark:text-[#CBD5E1] max-w-xs truncate">{e.targetResource}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          e.outcome === 'BLOCKED'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {e.outcome}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#5D6B7B] dark:text-[#A9BACB] text-[11px]">{new Date(e.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedSecurityEvent(e)}
                        className="px-2.5 py-1 bg-[#EDF1F5] dark:bg-[#1E3247] hover:bg-[#EDF1F5] dark:hover:bg-[#26394C] text-[#142C45] dark:text-[#E8EEF5] rounded font-medium text-[11px] transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. AI GOVERNANCE TAB */}
      {/* ========================================================================= */}
      {isPrivilegedAdmin && activeTab === 'ai' && aiGovernance && (
        <div className="space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-1">
              <span className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider font-semibold">Gemini API Key</span>
              <div className="text-sm font-bold flex items-center gap-1.5">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    aiGovernance.geminiStatus === 'CONFIGURED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {aiGovernance.geminiStatus}
                </span>
              </div>
              <span className="text-[10px] text-[#6B7C93] dark:text-[#8194A8] italic">Protected secret; never displayed</span>
            </div>
            <div className="p-4 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-1">
              <span className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider font-semibold">Foundation Model</span>
              <div className="font-mono text-xs font-semibold text-[#142C45] dark:text-[#E8EEF5] truncate">{aiGovernance.model}</div>
              <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">Institutional Governance Fine-Tuning</span>
            </div>
            <div className="p-4 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-1">
              <span className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider font-semibold">Copilot Sessions</span>
              <div className="text-2xl font-bold text-[#168C83] dark:text-[#46C3B2]">{aiGovernance.copilotSessions}</div>
              <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">Error Count: {aiGovernance.aiErrorCount}</span>
            </div>
            <div className="p-4 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-1">
              <span className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider font-semibold">Human Confirmations</span>
              <div className="text-2xl font-bold text-emerald-400">
                {aiGovernance.humanConfirmations} / {aiGovernance.aiActionProposals}
              </div>
              <span className="text-[10px] text-rose-400">{aiGovernance.rejectedActions} Actions Rejected</span>
            </div>
          </div>

          {/* Source Classification Breakdown */}
          <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-5 space-y-3">
            <h4 className="font-semibold text-[#142C45] dark:text-[#E8EEF5] text-xs">Source Classification Distribution</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {aiGovernance.sourceClassifications.map((sc) => (
                <div key={sc.classification} className="p-3 bg-[#F8FAFC] dark:bg-[#101C2A] rounded-lg border border-[#DCE3EA] dark:border-[#33485D] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-[#2D3F54] dark:text-[#CBD5E1] text-xs">{sc.classification}</span>
                    <span className="text-xs font-semibold text-[#168C83] dark:text-[#46C3B2]">{sc.percentage}%</span>
                  </div>
                  <div className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">{sc.count} total inferences</div>
                </div>
              ))}
            </div>
          </div>

          {/* Regulated Tool Usage */}
          <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-5 space-y-3">
            <h4 className="font-semibold text-[#142C45] dark:text-[#E8EEF5] text-xs">Controlled Tool Execution Breakdown</h4>
            <div className="divide-y divide-[#DCE3EA] dark:divide-[#33485D]">
              {aiGovernance.toolUsage.map((tu) => (
                <div key={tu.toolName} className="py-2.5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-[#142C45] dark:text-[#E8EEF5]">{tu.toolName}</span>
                    <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] bg-[#EDF1F5] dark:bg-[#1E3247] px-1.5 py-0.5 rounded font-mono">
                      {tu.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#5D6B7B] dark:text-[#A9BACB] text-[11px]">{tu.count} calls</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        tu.deterministic
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {tu.deterministic ? 'DETERMINISTIC' : 'PROBABILISTIC'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. INTEGRATIONS TAB */}
      {/* ========================================================================= */}
      {isPrivilegedAdmin && activeTab === 'integrations' && (
        <div className="space-y-4 text-xs">
          <div className="flex justify-between items-center bg-[#FFFFFF] dark:bg-[#162638] p-3 rounded-xl border border-[#DCE3EA] dark:border-[#33485D]">
            <div>
              <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5] text-xs">Enterprise API Gateway & Adapters</span>
              <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">Integrated Phase 38 adapter hub and simulated external providers.</p>
            </div>
            <a
              href="/integrations"
              className="px-3 py-1.5 rounded-lg bg-[#168C83] hover:bg-[#127069] text-white font-medium text-xs flex items-center gap-1.5 transition"
            >
              Open API Gateway Workspace <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] dark:bg-[#101C2A] border-b border-[#DCE3EA] dark:border-[#33485D] text-[#5D6B7B] dark:text-[#A9BACB] uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Adapter</th>
                  <th className="py-3 px-4">Domain</th>
                  <th className="py-3 px-4">Protocol</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Endpoints</th>
                  <th className="py-3 px-4">Success Rate</th>
                  <th className="py-3 px-4">Failures</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3EA] dark:divide-[#33485D]/60">
                {integrationsSummary.map((i) => (
                  <tr key={i.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#1E3247] transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#142C45] dark:text-[#E8EEF5]">{i.name}</div>
                      <div className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] font-mono">{i.integrationId}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-[#168C83] dark:text-[#46C3B2]">{i.domain}</td>
                    <td className="py-3 px-4 text-[#2D3F54] dark:text-[#CBD5E1] font-mono">{i.adapterType}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {i.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#2D3F54] dark:text-[#CBD5E1]">{i.endpointCount} endpoints</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#142C45] dark:text-[#E8EEF5]">{i.successRate}%</td>
                    <td className="py-3 px-4 font-mono text-[#5D6B7B] dark:text-[#A9BACB]">{i.failureCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. NOTIFICATIONS & SLA TAB */}
      {/* ========================================================================= */}
      {isPrivilegedAdmin && activeTab === 'notifications' && (
        <div className="space-y-6 text-xs">
          <div className="space-y-3">
            <h3 className="font-semibold text-[#142C45] dark:text-[#E8EEF5] text-sm">Notification Policies & Escalation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {notificationPolicies.map((np) => (
                <div key={np.id} className="p-4 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-[#142C45] dark:text-[#E8EEF5] text-xs">{np.category}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        np.severity === 'CRITICAL'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {np.severity}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#2D3F54] dark:text-[#CBD5E1]">Channel: {np.deliveryChannel}</div>
                  <div className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">Recipients: {np.recipients}</div>
                  <div className="pt-2 border-t border-[#DCE3EA] dark:border-[#33485D] flex justify-between text-[10px] text-[#6B7C93] dark:text-[#8194A8]">
                    <span>Dedup Window: {np.deduplicationWindowMinutes}m</span>
                    <span>Escalation Timeout: {np.escalationTimeoutMinutes}m</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isPrivilegedAdmin && activeTab === 'sla' && (
        <div className="space-y-4 text-xs">
          <div className="flex justify-between items-center bg-[#FFFFFF] dark:bg-[#162638] p-3 rounded-xl border border-[#DCE3EA] dark:border-[#33485D]">
            <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5] text-xs">Service Level Agreements (SLA) Matrix</span>
            <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">Configured across 6 banking operations domains</span>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] dark:bg-[#101C2A] border-b border-[#DCE3EA] dark:border-[#33485D] text-[#5D6B7B] dark:text-[#A9BACB] uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Domain</th>
                  <th className="py-3 px-4">Policy Name</th>
                  <th className="py-3 px-4">Threshold</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Escalation Target</th>
                  <th className="py-3 px-4">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3EA] dark:divide-[#33485D]/60">
                {slaPolicies.map((sp) => (
                  <tr key={sp.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#1E3247] transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#168C83] dark:text-[#46C3B2]">{sp.domain}</td>
                    <td className="py-3 px-4 font-semibold text-[#142C45] dark:text-[#E8EEF5]">{sp.name}</td>
                    <td className="py-3 px-4 font-mono text-[#2D3F54] dark:text-[#CBD5E1]">{sp.thresholdMinutes} minutes</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          sp.severity === 'CRITICAL'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {sp.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#2D3F54] dark:text-[#CBD5E1]">{sp.escalationTarget}</td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-400 font-semibold text-[10px]">ENFORCED</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. FEATURE FLAGS TAB */}
      {/* ========================================================================= */}
      {isPrivilegedAdmin && activeTab === 'flags' && (
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl text-amber-300 text-xs leading-relaxed">
            <span className="font-semibold block mb-0.5">Strict Governance Safety Rule</span>
            Feature flags may be used to disable modular capabilities, but can NEVER be used to bypass authentication, authorization, or audit logging.
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] dark:bg-[#101C2A] border-b border-[#DCE3EA] dark:border-[#33485D] text-[#5D6B7B] dark:text-[#A9BACB] uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Flag Key</th>
                  <th className="py-3 px-4">Name & Description</th>
                  <th className="py-3 px-4">Environment</th>
                  <th className="py-3 px-4">Rollout Scope</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4 text-right">Governed Switch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3EA] dark:divide-[#33485D]/60">
                {featureFlags.map((f) => (
                  <tr key={f.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#1E3247] transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#142C45] dark:text-[#E8EEF5]">{f.flagKey}</td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-semibold text-[#142C45] dark:text-[#E8EEF5]">{f.name}</div>
                      <div className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] mt-0.5">{f.description}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-[#168C83] dark:text-[#46C3B2]">{f.environment}</td>
                    <td className="py-3 px-4 text-[#2D3F54] dark:text-[#CBD5E1] font-mono text-[10px]">{f.rolloutScope}</td>
                    <td className="py-3 px-4 text-[#5D6B7B] dark:text-[#A9BACB] font-mono text-[10px]">{f.owner}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => promptToggleFeatureFlag(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          f.enabled
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-[#EDF1F5] dark:bg-[#1E3247] hover:bg-[#EDF1F5] dark:hover:bg-[#26394C] text-[#5D6B7B] dark:text-[#A9BACB]'
                        }`}
                      >
                        {f.enabled ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. SYSTEM & DATABASE HEALTH TAB */}
      {/* ========================================================================= */}
      {isPrivilegedAdmin && activeTab === 'system' && systemConfig && dbHealth && (
        <div className="space-y-6 text-xs">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-1">
              <span className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider font-semibold">Environment</span>
              <div className="text-base font-bold text-emerald-400">{systemConfig.environment}</div>
              <span className="text-[10px] text-[#6B7C93] dark:text-[#8194A8]">Synthetic institutional sandbox</span>
            </div>
            <div className="p-4 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-1">
              <span className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider font-semibold">Database Status</span>
              <div className="text-base font-bold text-[#142C45] dark:text-[#E8EEF5] flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-400" />
                {dbHealth.connectionStatus}
              </div>
              <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] font-mono">Latency: {dbHealth.latencyMs} ms</span>
            </div>
            <div className="p-4 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-1">
              <span className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider font-semibold">Node Engine</span>
              <div className="text-base font-bold text-[#168C83] dark:text-[#46C3B2] font-mono">{systemConfig.nodeVersion}</div>
              <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">Uptime: {systemConfig.uptimeSeconds}s</span>
            </div>
            <div className="p-4 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-1">
              <span className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider font-semibold">Application Version</span>
              <div className="text-sm font-bold text-[#142C45] dark:text-[#E8EEF5]">{systemConfig.applicationVersion}</div>
              <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] font-mono">{systemConfig.buildVersion}</span>
            </div>
          </div>

          {/* Workstation Theme & Visual Ergonomics Preference Panel */}
          <div className="p-5 bg-white dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold text-[#142C45] dark:text-[#E8EEF5] text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#168C83]" />
                  Workstation Theme & Visual Ergonomics Preference
                </h4>
                <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] mt-0.5">
                  Institutional color presentation engine with automatic OS synchronization, dark surface hierarchy, and WCAG AA contrast.
                </p>
              </div>
              <ThemeSwitcher variant="segmented" />
            </div>

            <div className="pt-2 border-t border-[#E8EEF4] dark:border-[#26394C] grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
              <div className="p-2.5 rounded-sm bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#26394C]">
                <div className="font-semibold text-[#142C45] dark:text-[#E8EEF5] mb-0.5">Light Mode</div>
                <div className="text-[10px] text-[#5D6B7B] dark:text-[#8194A8]">#F4F6F8 canvas, #FFFFFF cards, #142C45 navy header</div>
              </div>
              <div className="p-2.5 rounded-sm bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#26394C]">
                <div className="font-semibold text-[#142C45] dark:text-[#E8EEF5] mb-0.5">Dark Mode</div>
                <div className="text-[10px] text-[#5D6B7B] dark:text-[#8194A8]">#080F19 canvas, #162638 cards, #101C2A header</div>
              </div>
              <div className="p-2.5 rounded-sm bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#26394C]">
                <div className="font-semibold text-[#142C45] dark:text-[#E8EEF5] mb-0.5">System Mode</div>
                <div className="text-[10px] text-[#5D6B7B] dark:text-[#8194A8]">Dynamically syncs with OS color-scheme preference</div>
              </div>
            </div>
          </div>

          {/* Maintenance Mode Governance Panel */}
          <div className="p-5 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-[#142C45] dark:text-[#E8EEF5] text-sm flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-amber-400" />
                  Maintenance Mode Control
                </h4>
                <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] mt-0.5">
                  Allows administrators to defer non-admin transactions during schema migrations without lockout.
                </p>
              </div>
              <button
                onClick={promptToggleMaintenanceMode}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  maintenanceMode?.active
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-[#EDF1F5] dark:bg-[#1E3247] hover:bg-[#EDF1F5] dark:hover:bg-[#26394C] text-[#142C45] dark:text-[#E8EEF5]'
                }`}
              >
                {maintenanceMode?.active ? 'Disable Maintenance' : 'Enable Maintenance'}
              </button>
            </div>
            {maintenanceMode?.active && (
              <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg text-amber-200 space-y-1 text-xs">
                <div>Reason: {maintenanceMode.reason}</div>
                <div>Enabled By: {maintenanceMode.enabledBy}</div>
                <div>Started At: {new Date(maintenanceMode.startedAt!).toLocaleString()}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. BACKGROUND JOBS TAB */}
      {/* ========================================================================= */}
      {isPrivilegedAdmin && activeTab === 'jobs' && (
        <div className="space-y-4 text-xs">
          <div className="flex justify-between items-center bg-[#FFFFFF] dark:bg-[#162638] p-3 rounded-xl border border-[#DCE3EA] dark:border-[#33485D]">
            <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5] text-xs">Background Operations & Queues</span>
            <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">Scheduled SLA monitors and telemetry pollers</span>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] dark:bg-[#101C2A] border-b border-[#DCE3EA] dark:border-[#33485D] text-[#5D6B7B] dark:text-[#A9BACB] uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Job ID</th>
                  <th className="py-3 px-4">Operation Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4">Correlation ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3EA] dark:divide-[#33485D]/60">
                {backgroundJobs.map((j) => (
                  <tr key={j.jobId} className="hover:bg-[#F8FAFC] dark:hover:bg-[#1E3247] transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#142C45] dark:text-[#E8EEF5]">{j.jobId}</td>
                    <td className="py-3 px-4 font-semibold text-[#2D3F54] dark:text-[#CBD5E1]">{j.type}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          j.status === 'RUNNING'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#2D3F54] dark:text-[#CBD5E1]">{j.durationMs} ms</td>
                    <td className="py-3 px-4 text-[#5D6B7B] dark:text-[#A9BACB]">{j.attempts}</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-[#6B7C93] dark:text-[#8194A8]">{j.correlationId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13. AUDIT CENTER TAB */}
      {/* ========================================================================= */}
      {isPrivilegedAdmin && activeTab === 'audit' && (
        <div className="space-y-4 text-xs">
          <div className="flex justify-between items-center bg-[#FFFFFF] dark:bg-[#162638] p-3.5 rounded-xl border border-[#DCE3EA] dark:border-[#33485D]">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5] text-xs">Administrative Audit Center</span>
              {auditIntegrity && (
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${
                    auditIntegrity.status === 'VERIFIED'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  SHA-256 INTEGRITY: {auditIntegrity.status} ({auditIntegrity.checkedCount} records chained)
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#6B7C93] dark:text-[#8194A8] font-mono">Immutable Forensic Log</span>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] dark:bg-[#101C2A] border-b border-[#DCE3EA] dark:border-[#33485D] text-[#5D6B7B] dark:text-[#A9BACB] uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">Record Hash (SHA-256)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3EA] dark:divide-[#33485D]/60">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center font-sans">
                      <EmptyState
                        compact
                        icon={<FileCheck className="w-5 h-5 text-[#168C83] dark:text-[#46C3B2]" />}
                        title="No audit log entries matching filters"
                        description="Audit entries will be recorded with SHA-256 hash chaining as operations occur."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((a) => (
                  <tr key={a.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#1E3247] transition">
                    <td className="py-3 px-4 text-[#5D6B7B] dark:text-[#A9BACB] font-mono text-[11px]">
                      {new Date(a.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#142C45] dark:text-[#E8EEF5]">{a.actorName}</div>
                      <div className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] font-mono">{a.actorId}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#142C45] dark:text-[#E8EEF5]">{a.action}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#2D3F54] dark:text-[#CBD5E1]">
                      {a.resourceType}: {a.resourceId}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          a.outcome === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {a.outcome}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-[#6B7C93] dark:text-[#8194A8] max-w-xs truncate" title={a.recordHash}>
                      {a.recordHash ? a.recordHash.substring(0, 24) + '...' : 'N/A'}
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 15. USER PREFERENCES & STATION SETTINGS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Identity & Profile Card */}
            <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-[#DCE3EA] dark:border-[#33485D]">
                <div className="w-12 h-12 rounded-xl bg-[#168C83] text-white flex items-center justify-center font-bold text-base shadow-xs">
                  {user?.name ? user.name.substring(0, 2).toUpperCase() : 'DN'}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#142C45] dark:text-[#E8EEF5]">
                    {user?.name || 'Deepak Nambiar'}
                  </h3>
                  <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] font-mono">
                    {user?.employeeId || 'EMP-1049'} · {user?.email || 'deepak.nambiar@corevia.bank.in'}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#168C83]/10 text-[#168C83] dark:text-[#46C3B2] border border-[#168C83]/20">
                    {user?.role?.replace('_', ' ') || 'Relationship Manager'}
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-[#DCE3EA]/50 dark:border-[#33485D]/50">
                  <span className="text-[#5D6B7B] dark:text-[#A9BACB]">Assigned Branch:</span>
                  <span className="font-medium text-[#142C45] dark:text-[#E8EEF5]">South Mumbai Flagship (BR-1042)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCE3EA]/50 dark:border-[#33485D]/50">
                  <span className="text-[#5D6B7B] dark:text-[#A9BACB]">Department:</span>
                  <span className="font-medium text-[#142C45] dark:text-[#E8EEF5]">Private Banking & Wealth</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCE3EA]/50 dark:border-[#33485D]/50">
                  <span className="text-[#5D6B7B] dark:text-[#A9BACB]">Operating Circle:</span>
                  <span className="font-medium text-[#142C45] dark:text-[#E8EEF5]">West Zone - Maharashtra</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCE3EA]/50 dark:border-[#33485D]/50">
                  <span className="text-[#5D6B7B] dark:text-[#A9BACB]">Workstation Terminal:</span>
                  <span className="font-mono text-[#142C45] dark:text-[#E8EEF5]">WS-MUM-4029</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#5D6B7B] dark:text-[#A9BACB]">Hardware Key:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1 font-mono text-[11px]">
                    <CheckCircle2 className="w-3 h-3" /> FIDO2 Provisioned
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Theme & Appearance */}
            <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-5 space-y-4 shadow-xs">
              <div className="pb-3 border-b border-[#DCE3EA] dark:border-[#33485D]">
                <h3 className="font-bold text-sm text-[#142C45] dark:text-[#E8EEF5] flex items-center gap-2">
                  <Sun className="w-4 h-4 text-[#168C83] dark:text-[#46C3B2]" />
                  <span>Theme & Visual Ergonomics</span>
                </h3>
                <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] mt-0.5">
                  Select your terminal theme. Preferences persist across officer login sessions.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-[#142C45] dark:text-[#E8EEF5]">
                  Color Scheme Preference
                </label>
                <ThemeSwitcher variant="segmented" className="w-full justify-between" />
                <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] space-y-1">
                  <div className="font-semibold text-[#142C45] dark:text-[#E8EEF5]">
                    Theme Engine: <span className="uppercase text-[#168C83] dark:text-[#46C3B2]">Synchronized</span>
                  </div>
                  <p>
                    Instant theme switching with zero page refresh. High-contrast light and genuinely dark navy backgrounds.
                  </p>
                </div>
              </div>

              {/* Table Density & Display */}
              <div className="space-y-2 pt-2 border-t border-[#DCE3EA] dark:border-[#33485D]">
                <label className="block text-xs font-semibold text-[#142C45] dark:text-[#E8EEF5]">
                  Interface Table Density
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button className="py-1.5 px-2 rounded-lg bg-[#168C83] text-white font-semibold text-center shadow-xs">
                    Standard
                  </button>
                  <button className="py-1.5 px-2 rounded-lg bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] text-[#142C45] dark:text-[#E8EEF5] text-center hover:bg-[#EDF1F5] dark:hover:bg-[#1E3247]">
                    Compact
                  </button>
                  <button className="py-1.5 px-2 rounded-lg bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] text-[#142C45] dark:text-[#E8EEF5] text-center hover:bg-[#EDF1F5] dark:hover:bg-[#1E3247]">
                    High Density
                  </button>
                </div>
              </div>
            </div>

            {/* Column 3: Regional & Operational Defaults */}
            <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-5 space-y-4 shadow-xs">
              <div className="pb-3 border-b border-[#DCE3EA] dark:border-[#33485D]">
                <h3 className="font-bold text-sm text-[#142C45] dark:text-[#E8EEF5] flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#168C83] dark:text-[#46C3B2]" />
                  <span>Regional & Financial Conventions</span>
                </h3>
                <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] mt-0.5">
                  Standardized under Reserve Bank of India & Indian Banking Association guidelines.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#5D6B7B] dark:text-[#A9BACB] mb-1 font-medium">Currency Display Format</label>
                  <select className="w-full bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg px-2.5 py-1.5 text-[#142C45] dark:text-[#E8EEF5] text-xs">
                    <option value="INR_LAKHS">Indian Rupee (₹ Lakhs / Crores: ₹42.80L)</option>
                    <option value="INR_FULL">Indian Rupee Full (₹ 42,80,000.00)</option>
                    <option value="USD">US Dollar Equivalent ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#5D6B7B] dark:text-[#A9BACB] mb-1 font-medium">Date & Time Representation</label>
                  <select className="w-full bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg px-2.5 py-1.5 text-[#142C45] dark:text-[#E8EEF5] text-xs">
                    <option value="DD_MM_YYYY">DD/MM/YYYY (Indian Standard: 09/11/2026)</option>
                    <option value="ISO">YYYY-MM-DD (ISO 8601)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#5D6B7B] dark:text-[#A9BACB] mb-1 font-medium">Session Inactivity Lockout</label>
                  <select className="w-full bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg px-2.5 py-1.5 text-[#142C45] dark:text-[#E8EEF5] text-xs">
                    <option value="15">15 Minutes (Regulatory Mandatory Default)</option>
                    <option value="30">30 Minutes (Branch Floor Exception)</option>
                    <option value="60">60 Minutes (Trading Station Exception)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => toast.success('Station preferences saved successfully.')}
                    className="w-full py-2 bg-[#168C83] hover:bg-[#127069] text-white rounded-lg font-semibold text-xs transition shadow-xs cursor-pointer"
                  >
                    Save Station Preferences
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawers and Confirmation Modals */}
      <UserDetailDrawer
        detail={selectedUserDetail}
        onClose={() => setSelectedUserDetail(null)}
        onStatusChangeClick={(status) => {
          if (selectedUserDetail) {
            const u = usersList.find((x) => x.id === selectedUserDetail.identity.id);
            if (u) promptStatusChange(u, status);
          }
        }}
        onResetAccessClick={() => {
          if (selectedUserDetail) {
            const u = usersList.find((x) => x.id === selectedUserDetail.identity.id);
            if (u) promptResetAccess(u);
          }
        }}
        onRevokeSessionClick={promptRevokeSession}
        onRevokeAllSessionsClick={() => {
          if (selectedUserDetail) {
            promptRevokeAllSessions(selectedUserDetail.identity.id, selectedUserDetail.identity.name);
          }
        }}
      />

      <SecurityEventDetailDrawer
        event={selectedSecurityEvent}
        onClose={() => setSelectedSecurityEvent(null)}
      />

      <AdminConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        actionName={confirmModalState.actionName}
        targetDescription={confirmModalState.targetDescription}
        impactDescription={confirmModalState.impactDescription}
        confirmButtonLabel={confirmModalState.confirmButtonLabel}
        isDangerous={confirmModalState.isDangerous}
        isLoading={modalExecuting}
        onConfirm={confirmModalState.onConfirm}
        onCancel={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
