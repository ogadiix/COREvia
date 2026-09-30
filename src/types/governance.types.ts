/**
 * COREvia Phase 35: Trust & Governance Center Domain Types
 * Enterprise definitions for observable, explainable, and auditable banking governance.
 */

export type GovernanceStatus = 'OPERATIONAL' | 'ATTENTION_REQUIRED' | 'CRITICAL';

export type ExceptionCategory =
  | 'SECURITY'
  | 'AUTHORIZATION'
  | 'AI'
  | 'AGENT'
  | 'DATA'
  | 'AUDIT'
  | 'CONFIGURATION'
  | 'INTEGRATION'
  | 'OPERATIONAL';

export type ExceptionSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ExceptionStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

export interface GovernanceExceptionDTO {
  id: number;
  exceptionId: string;
  category: ExceptionCategory;
  severity: ExceptionSeverity;
  resourceType?: string | null;
  resourceId?: string | null;
  description: string;
  detectedAt: string;
  status: ExceptionStatus;
  assignedTo?: number | null;
  assignedUserName?: string | null;
  assignedUserRole?: string | null;
  resolvedAt?: string | null;
  resolution?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface GovernanceOverviewDTO {
  systemStatus: GovernanceStatus;
  statusReason: string;
  auditActivity: {
    totalEvents: number;
    successEvents: number;
    failureEvents: number;
    deniedEvents: number;
    recentEvents24h: number;
    chainedTamperEvidentCount: number;
  };
  aiActivity: {
    copilotSessions: number;
    agentPlans: number;
    deterministicResponses: number;
    hybridResponses: number;
    aiGeneratedResponses: number;
    aiFallbacks: number;
    toolCallsCount: number;
  };
  humanApprovals: {
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
  };
  security: {
    failedLogins: number;
    authorizationFailures: number;
    idorPreventionEvents: number;
    expiredSessions: number;
    rateLimitEvents: number;
    criticalEvents: number;
  };
  dataAccess: {
    customerContextRequests: number;
    groupContextRequests: number;
    exportRequests: number;
    documentAccessRequests: number;
  };
  governanceExceptions: {
    total: number;
    open: number;
    underReview: number;
    highCritical: number;
  };
  lastAuditTimestamp: string | null;
}

export interface AIGovernanceDTO {
  copilotSessions: number;
  aiGeneratedResponses: number;
  deterministicResponses: number;
  hybridResponses: number;
  systemRuleResponses: number;
  toolCallsBreakdown: {
    toolName: string;
    callCount: number;
    classification: 'FACT' | 'EVIDENCE' | 'INTERPRETATION' | 'RECOMMENDATION' | 'LIMITATION';
  }[];
  aiFallbacks: {
    timestamp: string;
    module: string;
    reason: string;
  }[];
  modelConfig: {
    provider: string;
    model: string;
    status: 'AVAILABLE' | 'DEGRADED' | 'NOT_CONFIGURED';
    keyConfigured: boolean; // Never leaks the actual API key string
  };
}

export interface AgentGovernanceDTO {
  totalSessions: number;
  plansCreated: number;
  approved: number;
  rejected: number;
  completed: number;
  partial: number;
  failed: number;
  expired: number;
  recentPlans: {
    planId: string;
    sessionId: number;
    customerId?: number | null;
    customerName?: string | null;
    title: string;
    objective: string;
    status: string;
    decisionTraceId?: string | null;
    scenarioId?: number | null;
    stepCount: number;
    createdAt: string;
    expiresAt: string;
  }[];
}

export interface AccessGovernanceDTO {
  totalEvents: number;
  loginEvents: number;
  logoutEvents: number;
  authorizationFailures: number;
  idorEvents: number;
  resourceAccess: {
    resourceType: string;
    count: number;
  }[];
  recentAccessEvents: {
    id: number;
    timestamp: string;
    actorId: string;
    actorName: string;
    action: string;
    resourceType: string;
    resourceId: string;
    outcome: string;
    requestId: string;
  }[];
}

export interface SecurityGovernanceDTO {
  failedLogins: number;
  authorizationFailures: number;
  expiredSessions: number;
  rateLimitEvents: number;
  securityWarnings: string[];
  activeSessionsCount: number;
  recentSecurityEvents: {
    id: number;
    timestamp: string;
    actorId: string;
    actorName: string;
    action: string;
    resourceType: string;
    resourceId: string;
    outcome: string;
    requestId: string;
    reason?: string;
  }[];
}

export interface DataLineageNodeDTO {
  id: string;
  label: string;
  type: 'SOURCE' | 'DERIVED' | 'SIMULATED' | 'AI_EXPLANATION' | 'HUMAN_ACTION' | 'AUDIT';
  system: string;
  freshness: string;
  description: string;
}

export interface DataLineageEdgeDTO {
  from: string;
  to: string;
  relationship: string;
}

export interface DataGovernanceDTO {
  customerContextAccessCount: number;
  groupContextAccessCount: number;
  documentAccessCount: number;
  exportActivityCount: number;
  searchAccessCount: number;
  copilotContextRetrievals: number;
  agentContextRetrievals: number;
  decisionEvidenceAccessCount: number;
  lineageNodes: DataLineageNodeDTO[];
  lineageEdges: DataLineageEdgeDTO[];
}

export interface ApprovalItemDTO {
  id: string;
  type: 'AGENT_PLAN' | 'OWNERSHIP_HANDOFF' | 'JOURNEY_ESCALATION' | 'HIGH_VALUE_MUTATION';
  title: string;
  objective: string;
  requestedBy: string;
  requestedAt: string;
  affectedEntityType: string;
  affectedEntityId: string;
  affectedEntityName?: string;
  decisionTraceId?: string | null;
  riskImpact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiredPermission: string;
  status: string;
  expiresAt?: string | null;
  actions: string[];
}

export interface ApprovalCenterDTO {
  pendingCount: number;
  items: ApprovalItemDTO[];
}

export interface ExportAuditRecordDTO {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  dataset: string;
  filterScope: string;
  timestamp: string;
  outcome: 'SUCCESS' | 'DENIED' | 'FAILURE';
  recordCount?: number;
  requestId: string;
}

export interface ExportGovernanceDTO {
  totalExports: number;
  successfulExports: number;
  deniedExports: number;
  recentExports: ExportAuditRecordDTO[];
}

export interface SystemHealthServiceDTO {
  status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'NOT_CONFIGURED';
  latencyMs?: number;
  details?: string;
}

export interface SystemHealthDTO {
  overall: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
  checkedAt: string;
  services: {
    api: SystemHealthServiceDTO;
    database: SystemHealthServiceDTO;
    authentication: SystemHealthServiceDTO;
    gemini: SystemHealthServiceDTO;
    notifications: SystemHealthServiceDTO;
    search: SystemHealthServiceDTO;
  };
}

export interface DecisionGovernanceDTO {
  totalDecisions: number;
  byMode: {
    DETERMINISTIC: number;
    HYBRID: number;
    AI_GENERATED: number;
    SYSTEM_RULE: number;
  };
  byEngine: Record<string, number>;
  byStatus: Record<string, number>;
  confirmedCount: number;
  rejectedCount: number;
  executedCount: number;
  recentDecisions: {
    decisionId: string;
    sourceEngine: string;
    decisionType: string;
    decisionMode: string;
    title: string;
    status: string;
    createdAt: string;
    evidenceCount: number;
  }[];
}

export interface ExceptionMutationPayload {
  assignedTo?: number;
  resolution?: string;
  dismissalReason?: string;
  notes?: string;
}
