/**
 * COREvia Phase 39: Enterprise Administration & Governance Center Types
 */

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'SUSPENDED';

export type SessionStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export type SecurityEventSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SecurityEventType =
  | 'AUTH_FAILURE'
  | 'AUTHORIZATION_FAILURE'
  | 'IDOR_ATTEMPT'
  | 'CSRF_FAILURE'
  | 'RATE_LIMIT'
  | 'INVALID_INPUT'
  | 'SECRET_ACCESS_ATTEMPT'
  | 'SUSPICIOUS_SESSION'
  | 'WEBHOOK_SIGNATURE_FAILURE'
  | 'INTEGRATION_AUTH_FAILURE'
  | string;

export type SecurityEventOutcome = 'DENIED' | 'BLOCKED' | 'FLAGGED' | 'CHALLENGED' | 'MITIGATED' | string;

export type PermissionDomain =
  | 'CUSTOMERS'
  | 'ACCOUNTS'
  | 'LOANS'
  | 'PRODUCTS'
  | 'SERVICE'
  | 'OPPORTUNITIES'
  | 'TASKS'
  | 'ANALYTICS'
  | 'COPILOT'
  | 'OPERATIONS'
  | 'INTEGRATIONS'
  | 'DOCUMENTS'
  | 'ONBOARDING'
  | 'GOVERNANCE'
  | 'ADMIN'
  | string;

export interface AdminOverviewDTO {
  activeUsers: number;
  inactiveUsers: number;
  totalUsers?: number;
  lockedUsers?: number;
  activeSessions: number;
  failedLoginAttempts: number;
  authorizationFailures: number;
  openGovernanceExceptions: number;
  securityEventsCount?: number;
  securityEvents?: number;
  activeIntegrations: number;
  failedIntegrations: number;
  enabledFeatureFlags: number;
  totalFeatureFlags?: number;
  runningJobs: number;
  failedJobs: number;
  maintenanceModeActive?: boolean;
  maintenanceMode?: 'NORMAL' | 'MAINTENANCE';
  timestamp?: string;
}

export interface AdminUserDTO {
  id: number;
  uid: string;
  employeeId: string;
  name: string;
  email: string;
  role: string;
  roleName?: string;
  department: string;
  status: UserStatus | string;
  isActive: boolean;
  lastLogin?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceScopeDTO {
  branch?: string;
  department?: string;
  rmPortfolio?: string | null;
  customerScope?: string;
  organization?: string;
  inheritedFrom?: string;
  scopeType?: string;
  name?: string;
  code?: string;
  usersAssignedCount?: number;
  description?: string;
  isolationRule?: string;
}

export interface AdminRoleDTO {
  id: number;
  code: string;
  name: string;
  description?: string;
  userCount: number;
  permissionCount?: number;
  permissionsCount?: number;
  permissions?: string[];
  scope: string;
  active?: boolean;
}

export interface AdminPermissionDTO {
  id: number;
  code: string;
  name: string;
  description?: string;
  domain: PermissionDomain;
  module?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignedRoles?: string[];
  rolesAssigned?: string[];
}

export interface AdminSessionDTO {
  id: number;
  sessionId?: string;
  sessionTokenPreview?: string;
  userId: number;
  userEmployeeId?: string;
  userName: string;
  userEmail?: string;
  userRole: string;
  department?: string;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  ipAddress?: string;
  userAgent?: string;
  status: SessionStatus | string;
}

export interface LoginActivityDTO {
  id: number;
  timestamp: string;
  user?: string;
  userIdentifier?: string;
  userName?: string;
  outcome: 'SUCCESS' | 'FAILED' | 'FAILURE' | 'LOCKED' | string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  requestId?: string;
  securityClassification?: 'NORMAL' | 'STANDARD_AUTH' | 'HIGH_PRIVILEGE_ADMIN' | 'SUSPICIOUS' | 'SUSPICIOUS_ATTEMPT' | string;
}

export interface SecurityEventDTO {
  id: number;
  eventId: string;
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  actorId?: string;
  actorName?: string;
  targetResource: string;
  requestId?: string;
  sourceIp?: string;
  source: string;
  outcome: SecurityEventOutcome;
  evidenceMetadata?: Record<string, any>;
  timestamp: string;
}

export interface AuditTrailItemDTO {
  id: number;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'DENIED';
  requestId: string;
  source: string;
  previousHash: string;
  recordHash: string;
  metadata?: Record<string, any>;
}

export interface AdminUserDetailDTO {
  identity: {
    id: number;
    uid: string;
    name: string;
    email: string;
    employeeId: string;
    status: UserStatus;
    createdAt: string;
    updatedAt: string;
  };
  employment: {
    department: string;
    jobTitle: string;
    reportingManager: string;
    branchCode: string;
    costCenter: string;
  };
  roles: AdminRoleDTO[];
  effectivePermissions: string[];
  resourceScope: ResourceScopeDTO;
  sessions: AdminSessionDTO[];
  loginActivity: LoginActivityDTO[];
  securityEvents: SecurityEventDTO[];
  auditHistory: AuditTrailItemDTO[];
}

export interface AdminAiGovernanceDTO {
  geminiStatus: 'CONFIGURED' | 'AVAILABLE' | 'MISSING' | 'NOT_CONFIGURED';
  model: string;
  configurationState: string;
  fallbackState: string;
  lastAiRequest?: string | null;
  aiErrorCount: number;
  copilotSessions?: number;
  copilotSessionsCount?: number;
  toolUsage: { toolName: string; count: number; category: string; deterministic: boolean }[];
  toolUsageBreakdown?: Record<string, number>;
  aiActionProposals?: number;
  actionProposalsCount?: number;
  humanConfirmations?: number;
  humanConfirmationsCount?: number;
  rejectedActions?: number;
  rejectedActionsCount?: number;
  sourceClassifications: { classification: string; count: number; percentage: number }[];
  classificationsBreakdown?: Record<string, number>;
  dataSource?: 'DATABASE_DERIVED' | 'SYNTHETIC_DEMO' | 'NOT_AVAILABLE';
}

export interface AdminIntegrationSummaryDTO {
  id: number;
  integrationId: string;
  name: string;
  domain: string;
  adapterType: string;
  status: string;
  environment: string;
  healthStatus: string;
  endpointCount: number;
  webhookCount: number;
  failureCount: number;
  successRate: number;
  lastHealthCheck: string | null;
}

export interface NotificationPolicyDTO {
  id: string;
  category: string;
  severity: string;
  deliveryChannel: string;
  deduplicationWindowMinutes: number;
  escalationTimeoutMinutes: number;
  active: boolean;
  recipients: string;
}

export interface SlaPolicyDTO {
  id: string;
  domain: string;
  name: string;
  thresholdMinutes: number;
  escalationTarget: string;
  severity: string;
  active: boolean;
}

export interface FeatureFlagDTO {
  id: number;
  flagKey: string;
  name: string;
  description: string;
  enabled: boolean;
  environment: string;
  rolloutScope: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface SystemConfigDTO {
  environment: 'DEVELOPMENT' | 'TEST' | 'STAGING' | 'PRODUCTION';
  applicationVersion: string;
  nodeVersion: string;
  databaseStatus: string;
  databaseLatencyMs?: number;
  geminiStatus: string;
  integrationStatus: string;
  buildVersion: string;
  featureFlagCount: number;
  migrationState: string;
  uptimeSeconds?: number;
  maintenanceMode?: 'NORMAL' | 'MAINTENANCE';
  maintenanceDetails?: {
    reason?: string;
    activatedBy?: string;
    activatedAt?: string;
    expectedEnd?: string;
  };
}

export interface DatabaseHealthDTO {
  connectionStatus: string;
  latencyMs: number;
  migrationState: string;
  schemaVersion: string;
  lastHealthCheck: string;
  activePoolConnections?: number;
}

export interface BackgroundJobDTO {
  jobId: string;
  name?: string;
  type: string;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
  durationMs?: number;
  attempts: number;
  error?: string | null;
  correlationId?: string;
  schedulePattern?: string;
  lastRunStatus?: 'SUCCESS' | 'FAILURE' | 'SKIPPED';
}

export interface MaintenanceModeConfigDTO {
  active: boolean;
  reason?: string | null;
  enabledBy?: string | null;
  startedAt?: string | null;
  expectedEndAt?: string | null;
  activatedBy?: string;
  activatedAt?: string;
  expectedEnd?: string;
  allowedRoles?: string[];
}
