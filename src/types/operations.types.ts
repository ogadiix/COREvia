/**
 * COREvia Phase 36: Banking Operations Workspace Types & DTOs
 */

export type OperationalApprovalType =
  | 'FEE_REVERSAL'
  | 'TRANSACTION_EXCEPTION'
  | 'LIMIT_REVISION'
  | 'LOAN_WORKFLOW_APPROVAL'
  | 'KYC_EXCEPTION_RESOLUTION'
  | 'DOCUMENT_OVERRIDE'
  | 'SERVICE_COMPENSATION'
  | 'OPERATIONAL_ADJUSTMENT';

export type OperationalApprovalStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'RETURNED'
  | 'EXPIRED';

export type OperationalExceptionCategory =
  | 'TRANSACTION'
  | 'KYC'
  | 'DOCUMENT'
  | 'SLA'
  | 'RECONCILIATION'
  | 'WORKFLOW'
  | 'SERVICE'
  | 'ACCOUNT'
  | 'LOAN'
  | 'INTEGRATION'
  | 'SYSTEM';

export type OperationalSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type OperationalExceptionStatus =
  | 'OPEN'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'WAITING'
  | 'RESOLVED'
  | 'CLOSED';

export type ReconciliationStatus =
  | 'MATCHED'
  | 'MISMATCH'
  | 'INVESTIGATING'
  | 'ADJUSTMENT_PENDING'
  | 'RESOLVED';

export type ReconciliationType =
  | 'ACCOUNT_BALANCE_MISMATCH'
  | 'TRANSACTION_COUNT_MISMATCH'
  | 'SETTLEMENT_MISMATCH'
  | 'PRODUCT_LEDGER_MISMATCH'
  | 'LOAN_BALANCE_DISCREPANCY';

export type OperationalEventType =
  | 'APPROVAL_CREATED'
  | 'APPROVAL_COMPLETED'
  | 'EXCEPTION_OPENED'
  | 'EXCEPTION_ESCALATED'
  | 'WORKFLOW_FAILED'
  | 'WORKFLOW_RECOVERED'
  | 'DOCUMENT_REJECTED'
  | 'KYC_EXCEPTION_CREATED'
  | 'RECONCILIATION_MISMATCH_DETECTED'
  | 'RECONCILIATION_RESOLVED'
  | 'SLA_BREACHED'
  | 'SYSTEM_WARNING';

export interface OperationsSummaryDTO {
  pendingApprovals: number;
  highPriorityExceptions: number;
  slaAtRisk: number;
  failedWorkflows: number;
  kycExceptions: number;
  documentExceptions: number;
  reconciliationExceptions: number;
  awaitingChecker: number;
  operationalTasksDue: number;
  resolvedToday: number;
  lastUpdated: string;
}

export interface OperationalApprovalDTO {
  id: number;
  approvalId: string;
  requestType: OperationalApprovalType;
  customerId: number | null;
  customerCode?: string | null;
  customerName?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  amount?: string | number | null;
  currency: string;
  makerId: number;
  makerName: string;
  makerRole?: string | null;
  checkerId?: number | null;
  checkerName?: string | null;
  checkerRole?: string | null;
  status: OperationalApprovalStatus;
  priority: OperationalSeverity;
  reason: string;
  evidence?: any;
  checkerNotes?: string | null;
  slaDeadline?: string | null;
  actionedAt?: string | null;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface OperationalExceptionDTO {
  id: number;
  exceptionId: string;
  category: OperationalExceptionCategory;
  severity: OperationalSeverity;
  source: string;
  customerId: number | null;
  customerCode?: string | null;
  customerName?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  description: string;
  evidence?: any;
  status: OperationalExceptionStatus;
  ownerId?: number | null;
  ownerName?: string | null;
  ownerRole?: string | null;
  slaDeadline?: string | null;
  resolutionNotes?: string | null;
  resolvedById?: number | null;
  resolvedByName?: string | null;
  resolvedAt?: string | null;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ReconciliationRecordDTO {
  id: number;
  reconciliationId: string;
  businessDate: string;
  source: string;
  reconciliationType: ReconciliationType;
  expectedValue: number | string;
  observedValue: number | string;
  variance: number | string;
  status: ReconciliationStatus;
  customerId?: number | null;
  accountNumber?: string | null;
  ownerId?: number | null;
  ownerName?: string | null;
  lastChecked: string;
  notes?: string | null;
  adjustmentApprovalId?: string | null;
  resolvedAt?: string | null;
  resolvedById?: number | null;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface FailedWorkflowDTO {
  workflowId: string;
  workflowType: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  failureStage: string;
  failureReason: string;
  retryAvailable: boolean;
  owner?: string;
  timestamp: string;
  status: string;
  metadata?: any;
}

export interface OperationalTaskDTO {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignedTo?: string;
  relatedCustomerName?: string;
  relatedCustomerCode?: string;
  category: string;
}

export interface OperationalEventDTO {
  id: number;
  eventId: string;
  eventType: OperationalEventType;
  severity: OperationalSeverity;
  sourceModule: string;
  customerId?: number | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  title: string;
  description: string;
  actorId?: number | null;
  actorName?: string | null;
  actorRole?: string | null;
  metadata?: any;
  createdAt: string;
}
