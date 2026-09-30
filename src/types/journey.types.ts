/**
 * COREvia Phase 33: Customer Journey Orchestrator & Lifecycle Management Types
 * Comprehensive governed customer lifecycle models, templates, step machines, SLA tracking, evidence schemas, and portfolio analytics.
 */

export type JourneyStatus =
  | 'NOT_STARTED'
  | 'ACTIVE'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'BLOCKED'
  | 'ESCALATED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'EXPIRED';

export type JourneyPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export type JourneyStepStatus =
  | 'PENDING'
  | 'READY'
  | 'IN_PROGRESS'
  | 'WAITING'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'FAILED'
  | 'CANCELLED';

export type JourneyStepType =
  | 'KYC'
  | 'DOCUMENT'
  | 'TASK'
  | 'INTERACTION'
  | 'REVIEW'
  | 'APPROVAL'
  | 'SERVICE_CASE'
  | 'OPPORTUNITY'
  | 'ONBOARDING'
  | 'COMMITMENT'
  | 'SIGNAL'
  | 'AGENT_ACTION'
  | 'MANUAL_CHECK'
  | 'WAITING_PERIOD';

export type JourneySLAStatus = 'ON_TRACK' | 'AT_RISK' | 'BREACHED' | 'COMPLETED';

export type JourneyOutcomeType =
  | 'GOAL_MET'
  | 'PARTIALLY_MET'
  | 'COMPLETED'
  | 'COMPLETED_SUCCESSFULLY'
  | 'COMPLETED_WITH_EXCEPTION'
  | 'CANCELLED'
  | 'FAILED'
  | 'CUSTOMER_DECLINED'
  | 'INTERNAL_BLOCK'
  | 'EXPIRED';

export type EvidenceType =
  | 'KYC_RECORD'
  | 'DOCUMENT'
  | 'TASK'
  | 'SERVICE_CASE'
  | 'OPPORTUNITY'
  | 'REVIEW'
  | 'INTERACTION'
  | 'APPROVAL'
  | 'SIGNAL'
  | 'AGENT_PLAN'
  | 'MANUAL_VERIFICATION';

export interface CompletionEvidence {
  evidenceType: EvidenceType;
  entityId: string | number;
  entityCode: string;
  summary: string;
  verifiedAt: string;
  verifiedBy: number;
  verifiedByName?: string;
  documentType?: string;
  sourceModule?: string;
  metadata?: Record<string, any>;
}

export interface JourneyProgressDTO {
  completedSteps: number;
  totalRequiredSteps: number;
  totalSteps: number;
  percentage: number;
  progressPercentage?: number;
  blockedStepsCount: number;
  overdueStepsCount: number;
  currentStepName?: string;
  nextStepName?: string;
}

export interface CustomerJourneyStepDTO {
  id: number;
  journeyId: number;
  stepId: string;
  stepNumber: number;
  stepKey: string;
  stepType: JourneyStepType;
  name: string;
  description: string;
  status: JourneyStepStatus;
  ownerId?: number | null;
  ownerName?: string;
  ownerRole?: string;
  required: boolean;
  dependency?: string | null;
  dependencyStepKeys?: string[];
  slaDays: number;
  startedAt?: string | null;
  completedAt?: string | null;
  dueAt?: string | null;
  dueDate?: string | null;
  slaStatus: JourneySLAStatus;
  blockedReason?: string | null;
  blockerReason?: string | null;
  completionEvidence?: CompletionEvidence | null;
  evidenceVerified?: boolean;
  assignedRole?: string;
  assignedUserName?: string;
  stepOrder?: number;
  notes?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface JourneyTimelineEventDTO {
  id: string;
  journeyId: string;
  timestamp: string;
  eventType: string;
  title: string;
  description: string;
  actorName?: string;
  status?: string;
  entityType?: string;
  entityId?: string | number;
  isEvidence?: boolean;
}

export interface JourneyOutcomeDTO {
  id: number;
  journeyId: number;
  outcomeType: JourneyOutcomeType;
  outcome: string;
  summary: string;
  evidence?: Record<string, any> | null;
  recordedBy: number;
  recordedByName?: string;
  recordedAt: string;
  metadata?: Record<string, any> | null;
}

export interface CustomerJourneyDTO {
  id: number;
  journeyId: string;
  customerId: number;
  customerCode?: string;
  customerName?: string;
  customerSegment?: string;
  templateId?: number | null;
  journeyType: string;
  name: string;
  description: string;
  status: JourneyStatus;
  priority: JourneyPriority;
  ownerId?: number | null;
  ownerName?: string;
  ownerRole: string;
  currentStepId?: number | null;
  currentStepName?: string;
  currentStepType?: JourneyStepType;
  startedAt?: string | null;
  targetCompletionAt?: string | null;
  completedAt?: string | null;
  blockedReason?: string | null;
  blockedAt?: string | null;
  slaStatus: JourneySLAStatus;
  escalatedAt?: string | null;
  escalatedTo?: number | null;
  escalatedToName?: string;
  escalatedBy?: number | null;
  escalatedByName?: string;
  escalationReason?: string | null;
  decisionTraceId?: string | null;
  progress: JourneyProgressDTO;
  steps?: CustomerJourneyStepDTO[];
  timeline?: JourneyTimelineEventDTO[];
  outcome?: JourneyOutcomeDTO | null;
  metadata?: Record<string, any> | null;
  journeyCode?: string;
  blockerReason?: string | null;
  targetCompletionDate?: string | null;
  progressPercentage?: number;
  createdBy?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface JourneyTemplateStepDTO {
  id: number;
  templateId: number;
  stepOrder: number;
  stepKey: string;
  name: string;
  description: string;
  stepType: JourneyStepType;
  required: boolean;
  slaDays: number;
  dependencyStepKeys?: string[];
  defaultOwnerRole: string;
  evidenceType?: string;
  createdAt: string;
}

export interface JourneyTemplateDTO {
  id: number;
  templateCode: string;
  name: string;
  description: string;
  category: string;
  defaultPriority: JourneyPriority;
  targetDurationDays: number;
  defaultOwnerRole: string;
  isActive: boolean;
  steps: JourneyTemplateStepDTO[];
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJourneyPayload {
  customerId: number;
  templateCode: string;
  name?: string;
  description?: string;
  priority?: JourneyPriority;
  ownerId?: number;
  ownerRole?: string;
  targetCompletionDate?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface UpdateJourneyStepPayload {
  status?: JourneyStepStatus;
  notes?: string;
  completionEvidence?: CompletionEvidence;
  blockedReason?: string;
  blockerReason?: string;
}

export interface HandoffJourneyPayload {
  newOwnerId?: number;
  targetUserId?: number;
  targetRole?: string;
  newOwnerRole?: string;
  reason: string;
}

export interface EscalateJourneyPayload {
  escalateToUserId?: number;
  urgency?: string;
  reason: string;
}

export interface RecordJourneyOutcomePayload {
  outcomeType: JourneyOutcomeType;
  outcome?: string;
  summary: string;
  goalMet?: boolean;
  evidence?: Record<string, any>;
}

export interface PortfolioJourneyAnalyticsDTO {
  totalJourneys: number;
  activeJourneys: number;
  totalActiveJourneys?: number;
  completedJourneys: number;
  blockedJourneys: number;
  atRiskJourneys: number;
  breachedJourneys: number;
  avgCompletionDays: number;
  completionRate: number;
  slaComplianceRate?: number;
  byType: Array<{
    type: string;
    label: string;
    count: number;
    active: number;
    completed: number;
    blocked: number;
  }>;
  byStatus: Record<string, number>;
  bySLA: Record<string, number>;
  topBottlenecks: Array<{
    stepKey: string;
    stepName: string;
    stepType: JourneyStepType;
    blockedCount: number;
    avgDelayHours: number;
  }>;
  recentEscalations: Array<{
    journeyId: string;
    customerName: string;
    reason: string;
    escalatedAt: string;
    escalatedToName: string;
  }>;
}

export interface JourneyFilterParams {
  customerId?: number;
  status?: JourneyStatus;
  priority?: JourneyPriority;
  slaStatus?: JourneySLAStatus;
  journeyType?: string;
  ownerId?: number;
  search?: string;
  limit?: number;
  offset?: number;
}
