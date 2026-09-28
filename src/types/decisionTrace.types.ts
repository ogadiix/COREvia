export type DecisionMode = 'DETERMINISTIC' | 'AI_GENERATED' | 'HYBRID' | 'SYSTEM_RULE';

export type DecisionType =
  | 'CORE_SCORE_CHANGE'
  | 'RELATIONSHIP_INSIGHT'
  | 'NEXT_BEST_ACTION'
  | 'OPPORTUNITY_RADAR'
  | 'RELATIONSHIP_SIGNAL'
  | 'COPILOT_RESPONSE'
  | 'COPILOT_ACTION'
  | 'RELATIONSHIP_REVIEW_PRIORITY'
  | 'SERVICE_PRIORITY'
  | 'TASK_PRIORITY'
  | 'CUSTOMER_HEALTH_CHANGE'
  | 'PRODUCT_OPPORTUNITY'
  | 'RELATIONSHIP_GRAPH_INSIGHT'
  | 'DIGITAL_TWIN_INSIGHT';

export type DecisionStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'EXECUTED'
  | 'CANCELLED'
  | 'EXPIRED';

export type EvidenceType =
  | 'CUSTOMER_FACT'
  | 'SCORE_CHANGE'
  | 'ACTIVITY_CHANGE'
  | 'SERVICE_EVENT'
  | 'OPPORTUNITY_EVENT'
  | 'TASK_EVENT'
  | 'INTERACTION_EVENT'
  | 'DOCUMENT_EVENT'
  | 'SIGNAL'
  | 'GRAPH_RELATIONSHIP'
  | 'RELATIONSHIP_STATE'
  | 'PRODUCT_EVENT'
  | 'COMMITMENT'
  | 'ANALYTIC_RESULT';

export type ContributionType =
  | 'PRIMARY'
  | 'SUPPORTING'
  | 'CONTEXT'
  | 'CONSTRAINT'
  | 'NEGATIVE_SIGNAL';

export interface DecisionTraceEvidenceDTO {
  id: number;
  decisionTraceId: number;
  evidenceType: EvidenceType;
  sourceEngine: string;
  sourceEntityType: string;
  sourceEntityId: string;
  sourceField?: string | null;
  description: string;
  observedValue: string;
  previousValue?: string | null;
  changeDirection?: 'INCREASE' | 'DECREASE' | 'STABLE' | 'TRIGGERED' | 'RESOLVED' | 'BREACHED' | null;
  contributionType: ContributionType;
  contributionWeight?: string | null;
  dataAsOf: string;
  createdAt: string;
}

export interface DecisionTraceSourceNodeDTO {
  id: number;
  decisionTraceId: number;
  orderIndex: number;
  sourceType: string;
  sourceId: string;
  sourceEngine: string;
  description: string;
  sourceTimestamp: string;
  authorizationScope: string;
  freshnessLabel?: string;
  createdAt: string;
}

export interface DecisionTraceDTO {
  id: number;
  decisionId: string; // e.g. DT-20260928-00142
  customerId?: number | null;
  customerName?: string | null;
  customerCif?: string | null;
  userId?: number | null;
  sourceModule: string;
  sourceEngine: string;
  decisionType: DecisionType;
  decisionStatus: DecisionStatus;
  recommendationTitle: string;
  recommendationSummary: string;
  recommendationPayload?: Record<string, any> | null;
  decisionMode: DecisionMode;
  confidence?: string | null;
  confidenceBasis: string;
  limitations: string[];
  actionTitle?: string | null;
  actionType?: string | null;
  actionPayload?: Record<string, any> | null;
  confirmedById?: number | null;
  confirmedByName?: string | null;
  confirmedAt?: string | null;
  executionStatus?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | null;
  executedAt?: string | null;
  outcome?: string | null;
  actionOutcome?: string | null;
  generatedAt: string;
  dataAsOf: string;
  dataFreshnessSummary?: string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  evidence?: DecisionTraceEvidenceDTO[];
  sourceChain?: DecisionTraceSourceNodeDTO[];
  freshnessBreakdown?: {
    engine: string;
    lastRefreshed: string;
    freshnessLabel: string;
  }[];
}

export interface DecisionComparisonDTO {
  baseTrace: DecisionTraceDTO;
  comparedTrace: DecisionTraceDTO;
  baseDecisionId?: string;
  targetDecisionId?: string;
  evidenceAdded: DecisionTraceEvidenceDTO[];
  evidenceRemoved: DecisionTraceEvidenceDTO[];
  evidenceCommon: DecisionTraceEvidenceDTO[];
  scoreChanges: {
    engine: string;
    metric: string;
    baseValue: string;
    comparedValue: string;
    delta?: string | number;
  }[];
  metricDeltas?: {
    engine: string;
    metric: string;
    baseValue: string;
    comparedValue: string;
    delta?: string | number;
  }[];
  sourceDifferences?: string[];
  summaryOfDifferences: string;
  summary?: string;
}

export interface DecisionAnalyticsSummaryDTO {
  totalTracesGenerated: number;
  totalTracesViewed: number;
  statusBreakdown: {
    pending: number;
    confirmed: number;
    rejected: number;
    executed: number;
    cancelled: number;
    expired: number;
  };
  modeBreakdown: {
    deterministic: number;
    hybrid: number;
    aiGenerated: number;
    systemRule: number;
  };
  tracesBySourceEngine: {
    engine: string;
    count: number;
  }[];
  tracesByDecisionType: {
    type: string;
    count: number;
  }[];
  recentActivity: {
    date: string;
    generated: number;
    confirmed: number;
    executed: number;
  }[];
}
