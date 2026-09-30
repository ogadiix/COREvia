/**
 * COREvia Phase 30: Relationship Strategy Simulator & What-If Sandbox
 * Domain Models, Action Types, and DTOs
 */

export type ScenarioStatus = 'DRAFT' | 'SIMULATED' | 'SAVED' | 'ARCHIVED';

export type ScenarioActionType =
  | 'SCHEDULE_RELATIONSHIP_REVIEW'
  | 'RESOLVE_SERVICE_CASE'
  | 'FOLLOW_UP_OPPORTUNITY'
  | 'COMPLETE_TASK'
  | 'COMPLETE_COMMITMENT'
  | 'LOG_RELATIONSHIP_INTERACTION'
  | 'INCREASE_ENGAGEMENT_ACTIVITY'
  | 'ACTIVATE_EXISTING_PRODUCT_OPPORTUNITY'
  | 'UPDATE_RELATIONSHIP_REVIEW_STATUS';

export type MetricChangeType = 'IMPROVED' | 'DECLINED' | 'UNCHANGED' | 'NOT_CALCULATED';

export interface RelationshipMetricComparison {
  metric: string;
  currentValue: string | number;
  simulatedValue: string | number;
  change: string | number;
  changeType: MetricChangeType;
  sourceEngine: string;
  explanation: string;
}

export interface RelationshipStateSnapshot {
  customerId: number;
  customerCode: string;
  customerName: string;
  coreScore: number;
  previousCoreScore: number;
  scoreDelta: number;
  relationshipMomentum: 'ACCELERATING' | 'STABLE' | 'DECLINING' | 'STRONG' | 'MODERATE' | 'WEAK';
  relationshipState:
    | 'STABLE'
    | 'SERVICE_RECOVERY'
    | 'ATTENTION_REQUIRED'
    | 'GROWING'
    | 'FOLLOW_UP_REQUIRED'
    | 'ENGAGED'
    | 'ONBOARDING_ACTIVE';
  serviceHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'CRITICAL' | 'POOR';
  engagementScore: number;
  productDepth: number;
  totalDeposits: number;
  totalLoans: number;
  relationshipValue: number;
  openCasesCount: number;
  criticalCasesCount: number;
  slaRiskCasesCount: number;
  openOpportunitiesCount: number;
  stalledOpportunitiesCount: number;
  openTasksCount: number;
  overdueTasksCount: number;
  openCommitmentsCount: number;
  daysSinceLastInteraction: number;
  reviewStatus: 'SCHEDULED' | 'PENDING' | 'OVERDUE' | 'COMPLETED' | 'NONE';
  activeSignalsCount: number;
  asOf: string;
}

export interface ScenarioActionItem {
  id?: number;
  actionType: ScenarioActionType;
  targetEntityType?: 'SERVICE_CASE' | 'OPPORTUNITY' | 'TASK' | 'COMMITMENT' | 'RELATIONSHIP_REVIEW' | 'PRODUCT' | 'CUSTOMER';
  targetEntityId?: string;
  parameters?: Record<string, any>;
  orderIndex: number;
  label?: string;
  description?: string;
}

export interface ScenarioIntermediateStep {
  stepIndex: number;
  action: ScenarioActionItem;
  stateAfter: Partial<RelationshipStateSnapshot>;
  deltaExplanation: string;
}

export interface StrategySimulationResultDTO {
  scenarioId: string;
  scenarioName?: string;
  customerId: number;
  customerName: string;
  customerCode: string;
  baseSnapshot: RelationshipStateSnapshot;
  simulatedSnapshot: RelationshipStateSnapshot;
  comparisons: RelationshipMetricComparison[];
  intermediateSteps: ScenarioIntermediateStep[];
  whyFactors: Array<{
    factor: string;
    engine: string;
    impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  }>;
  sourceRules: string[];
  limitations: string[];
  decisionTraceId?: string;
  simulatedAt: string;
  isSimulation: true;
  simulationDisclaimer: string;
}

export interface StrategyScenarioDTO {
  id: number;
  scenarioId: string;
  customerId: number;
  customerName?: string;
  customerCode?: string;
  createdBy: number;
  creatorName?: string;
  name: string;
  description?: string;
  status: ScenarioStatus;
  actions: ScenarioActionItem[];
  baseSnapshot: RelationshipStateSnapshot;
  resultSnapshot?: RelationshipStateSnapshot;
  comparisons?: RelationshipMetricComparison[];
  decisionTraceId?: string;
  isStale: boolean;
  staleAsOf?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScenarioComparisonDTO {
  baseScenario: { id: string; name: string; status: string; customerId: number };
  targetScenario: { id: string; name: string; status: string; customerId: number };
  metricComparisons: Array<{
    metric: string;
    baseSimulatedValue: string | number;
    targetSimulatedValue: string | number;
    difference: string | number;
    advantage: 'BASE' | 'TARGET' | 'EQUAL' | 'NOT_APPLICABLE';
  }>;
  commonActions: string[];
  uniqueBaseActions: string[];
  uniqueTargetActions: string[];
  comparisonSummary: string;
}

export interface StrategyAnalyticsSummaryDTO {
  totalScenarios: number;
  totalSimulationsRun: number;
  savedScenarios: number;
  archivedScenarios: number;
  actionTypeFrequency: Record<string, number>;
  userActivity: Array<{ userId: number; userName: string; count: number }>;
  timeline: Array<{ date: string; count: number }>;
}
