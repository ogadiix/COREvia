/**
 * COREvia Phase 31: Controlled Banking Agent & Governed Multi-Step Execution
 * Domain Models, Allowlisted Action Definitions, Governance Types, and DTOs
 */

export type AgentSessionStatus =
  | 'ACTIVE'
  | 'AWAITING_APPROVAL'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'EXPIRED';

export type AgentPlanStatus =
  | 'DRAFT'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'FAILED'
  | 'EXPIRED';

export type AgentStepStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED'
  | 'CANCELLED';

export type AgentContextType =
  | 'CUSTOMER'
  | 'ACCOUNT'
  | 'LOAN'
  | 'OPPORTUNITY'
  | 'SERVICE_CASE'
  | 'RELATIONSHIP_REVIEW'
  | 'SIGNAL'
  | 'DIGITAL_TWIN'
  | 'STRATEGY_SCENARIO'
  | 'COMMAND_CENTER'
  | 'PORTFOLIO'
  | 'GROUP';

// Strict Allowlist of Controlled Read-only Actions
export type AgentReadOnlyActionType =
  | 'GET_CUSTOMER_CONTEXT'
  | 'GET_CUSTOMER_360'
  | 'GET_CORE_SCORE'
  | 'GET_RELATIONSHIP_HEALTH'
  | 'GET_ACTIVE_SIGNALS'
  | 'GET_OPPORTUNITIES'
  | 'GET_SERVICE_CASES'
  | 'GET_TASKS'
  | 'GET_INTERACTIONS'
  | 'GET_COMMITMENTS'
  | 'GET_RELATIONSHIP_REVIEWS'
  | 'GET_DOCUMENT_STATUS'
  | 'GET_RELATIONSHIP_GRAPH'
  | 'GET_DECISION_TRACE'
  | 'SIMULATE_STRATEGY'
  | 'GET_RELATIONSHIP_VALUE_PROFILE'
  | 'COMPARE_RELATIONSHIP_VALUE_SCENARIO'
  | 'INSPECT_CUSTOMER_JOURNEYS'
  | 'GET_JOURNEY_STATUS'
  | 'INSPECT_GROUP'
  | 'GET_GROUP_STATUS';

// Strict Allowlist of Governed Mutating Actions (Financial Mutations are Strictly Banned)
export type AgentMutatingActionType =
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'CREATE_INTERACTION'
  | 'CREATE_RELATIONSHIP_REVIEW'
  | 'CREATE_FOLLOW_UP'
  | 'UPDATE_OPPORTUNITY'
  | 'UPDATE_SERVICE_CASE'
  | 'CREATE_NOTIFICATION';

export type AgentActionType = AgentReadOnlyActionType | AgentMutatingActionType;

export interface AgentToolDefinition {
  name: AgentActionType;
  description: string;
  isMutation: boolean;
  requiredPermission: string;
  resourceType: string;
  auditAction: string;
  requiresConfirmation: boolean;
  idempotencyRequired: boolean;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
}

export interface AgentExecutionContextDTO {
  contextType: AgentContextType;
  contextId?: string;
  customerId?: number;
  customerCode?: string;
  customerName?: string;
  cifNumber?: string;
  resolvedAt: string;
  summary: string;
  authorizedScope: string;
  availableSignalsCount: number;
  openCasesCount: number;
  stalledOpportunitiesCount: number;
  openTasksCount: number;
  recentScore?: number;
  relationshipMomentum?: string;
  rawContextPayload?: Record<string, any>;
}

export interface AgentPlanStepDTO {
  id?: number;
  planId?: number;
  stepNumber: number;
  actionType: AgentActionType;
  targetEntityType?: string;
  targetEntityId?: string;
  parameters?: Record<string, any>;
  rationale: string;
  requiredPermission: string;
  status: AgentStepStatus;
  requiresConfirmation: boolean;
  dependsOnStepNumber?: number | null;
  dependencyPolicy?: 'SKIP' | 'REQUIRE_REVIEW';
  idempotencyKey?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  resultSummary?: string | null;
  auditLogId?: number | null;
  verifiedAt?: string | null;
  selectedForApproval?: boolean;
}

export interface AgentPlanDTO {
  id: number;
  planId: string;
  sessionId: number;
  sessionCode?: string;
  customerId?: number | null;
  customerCode?: string | null;
  customerName?: string | null;
  title: string;
  objective: string;
  status: AgentPlanStatus;
  planVersion: number;
  decisionTraceId?: string | null;
  scenarioId?: string | null;
  estimatedEffect?: string | null;
  planRationale?: string | null;
  rejectionReason?: string | null;
  steps: AgentPlanStepDTO[];
  isStale?: boolean;
  staleReason?: string | null;
  expiresAt?: string | null;
  approvedAt?: string | null;
  approvedBy?: number | null;
  approvedByName?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentSessionDTO {
  id: number;
  sessionId: string;
  userId: number;
  userName?: string;
  customerId?: number | null;
  customerCode?: string | null;
  customerName?: string | null;
  contextType: AgentContextType;
  contextId?: string | null;
  status: AgentSessionStatus;
  startedAt: string;
  endedAt?: string | null;
  context?: AgentExecutionContextDTO;
  activePlan?: AgentPlanDTO | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentPlanValidationResultDTO {
  valid: boolean;
  errors: string[];
  warnings: string[];
  executableStepsCount: number;
  requiresApproval: boolean;
  revalidationRequired: boolean;
}

export interface AgentStepExecutionResultDTO {
  stepNumber: number;
  actionType: AgentActionType;
  status: AgentStepStatus;
  entityType?: string;
  entityId?: string;
  resultSummary: string;
  verified: boolean;
  verificationDetails?: string;
  auditLogId?: number;
  idempotencyKey?: string;
  durationMs: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface AgentExecutionReportDTO {
  planId: string;
  sessionId: string;
  status: AgentPlanStatus;
  totalSteps: number;
  completedStepsCount: number;
  skippedStepsCount: number;
  failedStepsCount: number;
  startedAt: string;
  completedAt: string;
  executionSteps: AgentStepExecutionResultDTO[];
  auditReferences: Array<{ stepNumber: number; action: string; auditLogId: number; timestamp: string }>;
  summary: string;
}

export interface AgentPlanApprovalRequestDTO {
  approvedStepNumbers?: number[]; // If provided, partial approval of selected steps; otherwise all steps
  approvalNotes?: string;
}

export interface CreateAgentPlanInput {
  sessionId: string | number;
  title: string;
  objective: string;
  decisionTraceId?: string;
  scenarioId?: string;
  estimatedEffect?: string;
  planRationale?: string;
  steps: Array<{
    stepNumber?: number;
    actionType: AgentActionType;
    targetEntityType?: string;
    targetEntityId?: string;
    parameters?: Record<string, any>;
    rationale: string;
    dependsOnStepNumber?: number | null;
    dependencyPolicy?: 'SKIP' | 'REQUIRE_REVIEW';
  }>;
}
