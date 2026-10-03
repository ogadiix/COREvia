/**
 * COREvia Phase 37: Advanced Portfolio Intelligence Types & DTOs
 * Explainable portfolio-level relationship health, value, CORE score,
 * momentum, penetration, engagement, service quality, what-changed, and concentration.
 */

export interface MetricDefinitionDTO {
  metricKey: string;
  label: string;
  source: string;
  timePeriod: string;
  population: string;
  calculation: string;
}

export interface PortfolioFilterParams {
  rmId?: number;
  branchId?: number | string;
  branchCode?: string;
  entityType?: string;
  segment?: string;
  tier?: string;
  status?: string;
  coreScoreBand?: string;
  momentum?: string;
  momentumState?: string;
  serviceHealth?: string;
  opportunityStage?: string;
  signalSeverity?: string;
  period?: '30D' | '60D' | '90D' | 'YTD' | string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface PortfolioOverviewDTO {
  authorizedCustomers: number;
  totalRelationshipValue: number;
  averageRelationshipValue: number;
  activeProducts: number;
  averageCoreScore: number;
  customersWithPositiveMomentum: number;
  customersWithNegativeMomentum: number;
  customersWithStableMomentum: number;
  openOpportunities: number;
  opportunityPipelineValue: number;
  openServiceCases: number;
  slaRiskCount: number;
  activeSignals: number;
  outstandingActions: number;
  asOfTimestamp: string;
  portfolioScope: string;
  metricDefinitions: Record<string, MetricDefinitionDTO>;
  definitions: Record<string, MetricDefinitionDTO>;
}

export interface HealthDistributionBucket {
  state: 'HEALTHY' | 'STABLE' | 'WATCH' | 'AT_RISK' | 'CRITICAL';
  label: string;
  count: number;
  percentage: number;
  averageCoreScore: number;
  totalRelationshipValue: number;
  customerIds: number[];
}

export interface CoreScoreDistributionBucket {
  band: string;
  label: string;
  minScore: number;
  maxScore: number;
  count: number;
  percentage: number;
}

export interface CoreScoreAnalysisDTO {
  averageScore: number;
  medianScore: number;
  minScore: number;
  maxScore: number;
  distribution: CoreScoreDistributionBucket[];
  componentAverages: {
    relationshipValueAvg: number;
    productDepthAvg: number;
    engagementAvg: number;
    serviceHealthAvg: number;
    momentumAvg: number;
  };
  meaningfulMovements: Array<{
    customerId: number;
    customerCode: string;
    customerName: string;
    previousScore: number;
    currentScore: number;
    change: number;
    direction: 'IMPROVED' | 'DECLINED' | 'STABLE';
    evidence: string;
  }>;
}

export interface RelationshipValueAnalysisDTO {
  totalValue: number;
  averageValue: number;
  medianValue: number;
  byEntityType: Array<{ entityType: string; count: number; totalValue: number; averageValue: number }>;
  byRiskCategory: Array<{ riskCategory: string; count: number; totalValue: number }>;
  topConcentration: Array<{
    customerId: number;
    customerCode: string;
    customerName: string;
    relationshipValue: number;
    portfolioSharePercentage: number;
  }>;
  top5ConcentrationPct: number;
  top10ConcentrationPct: number;
}

export interface ProductPenetrationItem {
  productCode: string;
  productName: string;
  category: string;
  customerCount: number;
  penetrationPercentage: number;
  totalHoldingsValue: number;
}

export interface ProductPenetrationDTO {
  products: ProductPenetrationItem[];
  depthDistribution: Array<{ productCount: number; customerCount: number; percentage: number }>;
  shallowDepthCustomers: Array<{
    customerId: number;
    customerCode: string;
    customerName: string;
    productCount: number;
    productsHeld: string[];
  }>;
}

export interface EngagementIntelligenceDTO {
  totalInteractions: number;
  averageInteractionsPerCustomer: number;
  channelBreakdown: Array<{ channel: string; count: number; percentage: number }>;
  recencyBreakdown: {
    last7Days: number;
    last8to30Days: number;
    last31to60Days: number;
    over60DaysInactive: number;
  };
  inactiveCustomers: Array<{
    customerId: number;
    customerCode: string;
    customerName: string;
    daysSinceLastInteraction: number;
    lastInteractionDate: string | null;
    rule: string;
  }>;
  recentActiveCustomers: Array<{
    customerId: number;
    customerCode: string;
    customerName: string;
    recentInteractionsCount: number;
    lastInteractionDate: string;
  }>;
}

export interface ServiceQualityDTO {
  totalCases: number;
  openCases: number;
  resolvedCases: number;
  slaAtRiskCount: number;
  slaBreachedCount: number;
  categoryDistribution: Array<{ category: string; count: number; percentage: number }>;
  resolutionRate: number;
  customerConcentration: Array<{
    customerId: number;
    customerCode: string;
    customerName: string;
    openCaseCount: number;
    slaAtRiskCount: number;
  }>;
}

export interface OpportunityPortfolioDTO {
  totalOpportunities: number;
  totalPipelineValue: number;
  weightedPipelineValue: number;
  stageBreakdown: Array<{ stage: string; count: number; totalValue: number; weightedValue: number }>;
  stalledOpportunities: Array<{
    opportunityId: number;
    title: string;
    customerId: number;
    customerName: string;
    amount: number;
    stage: string;
    stalledDays: number;
    stalledReason: string;
  }>;
  upcomingClosures: Array<{
    opportunityId: number;
    title: string;
    customerId: number;
    customerName: string;
    amount: number;
    expectedCloseDate: string;
    stage: string;
  }>;
}

export interface SignalPortfolioDTO {
  totalActiveSignals: number;
  severityBreakdown: { critical: number; high: number; medium: number; low: number };
  typeBreakdown: Array<{ signalType: string; count: number }>;
  recentSignals: Array<{
    id: number;
    signalCode: string;
    customerId: number;
    customerName: string;
    signalType: string;
    headline: string;
    severity: string;
    evidence: string;
    status: string;
    createdAt: string;
  }>;
}

export interface NbaPortfolioDTO {
  totalAvailableNbas: number;
  categoryBreakdown: Array<{ category: string; count: number }>;
  statusBreakdown: { pending: number; accepted: number; dismissed: number; completed: number };
  highImpactNbas: Array<{
    id: number;
    customerId: number;
    customerName: string;
    title: string;
    category: string;
    priority: string;
    impact: string;
    rationale: string;
  }>;
}

export interface ActionOutcomeDTO {
  totalProposed: number;
  totalExecuted: number;
  totalSuccessful: number;
  totalPending: number;
  outcomesBreakdown: Array<{ status: string; count: number }>;
  recentTraces: Array<{
    id: number;
    traceCode: string;
    customerId: number;
    customerName: string;
    actionTitle: string;
    actionType: string;
    status: string;
    outcomeSummary: string | null;
    executedAt: string | null;
  }>;
}

export interface WhatChangedItem {
  id: string;
  customerId: number;
  customerCode: string;
  customerName: string;
  changeType:
    | 'CORE_SCORE_CHANGED'
    | 'RELATIONSHIP_VALUE_CHANGED'
    | 'PRODUCT_ADDED'
    | 'SERVICE_CASE_OPENED'
    | 'SERVICE_CASE_RESOLVED'
    | 'OPPORTUNITY_ADVANCED'
    | 'OPPORTUNITY_STALLED'
    | 'SIGNAL_DETECTED'
    | 'SIGNAL_RESOLVED'
    | 'OPERATIONAL_EXCEPTION_CREATED'
    | 'OPERATIONAL_EXCEPTION_RESOLVED';
  entity: string;
  previousValue: string;
  currentValue: string;
  timestamp: string;
  source: string;
  evidence: string;
}

export interface PortfolioChangelogEvent {
  id: string;
  category: 'CUSTOMER' | 'OPPORTUNITY' | 'SERVICE' | 'PRODUCT' | 'RELATIONSHIP' | 'SIGNAL' | 'OPERATION';
  customerId?: number | null;
  customerName?: string | null;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
}

export interface HealthMatrixQuadrant {
  quadrantId: 'HIGH_CORE_POS_MOMENTUM' | 'HIGH_CORE_NEG_MOMENTUM' | 'DEV_CORE_POS_MOMENTUM' | 'DEV_CORE_NEG_MOMENTUM';
  label: string;
  description: string;
  count: number;
  percentage: number;
  customerIds: number[];
}

export interface FocusAreaGroup {
  id?: string;
  focusKey: string;
  title: string;
  description?: string;
  evidenceRule: string;
  ruleEvidence?: string;
  count: number;
  customerCount?: number;
  priority?: string;
  customers: Array<{
    customerId: number;
    customerCode: string;
    customerName: string;
    keyDetail: string;
  }>;
}

export interface CustomerPortfolioSummaryItem {
  id: number;
  customerCode: string;
  name: string;
  entityType: string;
  riskCategory: string;
  relationshipValue: number;
  coreScore: number;
  momentum: string;
  productCount: number;
  openCasesCount: number;
  openOpportunitiesCount: number;
  activeSignalsCount: number;
  lastInteractionDate: string | null;
  availableNbaTitle?: string | null;
}

export interface CustomerPortfolioProfileDTO {
  id: number;
  customerCode: string;
  name: string;
  entityType: string;
  riskCategory: string;
  relationshipValue: number;
  coreScore: number;
  momentum: string;
  productDepth: number;
  engagementScore: number;
  serviceHealth: string;
  openCases: number;
  openOpportunitiesValue: number;
  activeSignalsCount: number;
  availableNbasCount: number;
  customer: {
    id: number;
    customerCode: string;
    cifNumber: string;
    name: string;
    entityType: string;
    riskCategory: string;
  };
  metrics: {
    relationshipValue: number;
    coreScore: number;
    momentum: string;
    productDepth: number;
    serviceHealth: string;
  };
  products: Array<{ productName: string; category: string; balance?: number }>;
  engagement: {
    totalInteractions: number;
    daysSinceLastInteraction: number | null;
    lastInteractionDate: string | null;
  };
  serviceQuality: {
    openCasesCount: number;
    slaAtRiskCount: number;
  };
  nextBestActions: Array<{ id: number; title: string; priority: string; rationale: string }>;
  signals: Array<{ id: number; headline: string; severity: string; evidence: string }>;
  recentActions: Array<{
    actionTitle: string;
    status: string;
    outcomeSummary?: string | null;
    timestamp: string;
  }>;
  links: {
    customer360Url: string;
    relationshipTwinUrl: string;
    serviceDeskUrl: string;
  };
}

export interface PortfolioPeriodComparisonDTO {
  period1: {
    label: string;
    range: string;
    customerCount: number;
    totalRelationshipValue: number;
    averageCoreScore: number;
    opportunityPipelineValue: number;
    openCases: number;
  };
  period2: {
    label: string;
    range: string;
    customerCount: number;
    totalRelationshipValue: number;
    averageCoreScore: number;
    opportunityPipelineValue: number;
    openCases: number;
  };
  metrics: Array<{
    metricLabel: string;
    period1Value: number | string;
    period2Value: number | string;
    change: number | string;
    direction: 'IMPROVED' | 'DECLINED' | 'STABLE' | 'NEUTRAL';
  }>;
  deltas: {
    customerCountChange: number;
    relationshipValueChangePct: number;
    coreScoreDelta: number;
    pipelineValueChange: number;
    openCasesDelta: number;
  };
  populationScope: string;
}
