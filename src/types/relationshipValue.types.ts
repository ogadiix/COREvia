/**
 * COREvia Phase 32: Relationship Value & Portfolio Scenario Intelligence
 * Multidimensional Relationship Value Model, Snapshot, Comparison, and Portfolio Analytics Types.
 */

export type DimensionChangeType = 'IMPROVED' | 'DECLINED' | 'UNCHANGED' | 'NOT_CALCULATED';

export type RelationshipDimensionKey =
  | 'RELATIONSHIP_VALUE'
  | 'CORE_SCORE'
  | 'PRODUCT_DEPTH'
  | 'ENGAGEMENT'
  | 'SERVICE_HEALTH'
  | 'RELATIONSHIP_MOMENTUM'
  | 'OPPORTUNITY_COVERAGE'
  | 'COMMITMENT_HEALTH'
  | 'ACTIVITY_HEALTH'
  | 'RELATIONSHIP_STATE';

export interface RelationshipDimensionItem {
  dimension: RelationshipDimensionKey;
  label: string;
  currentValue: string | number;
  scenarioValue: string | number;
  simulatedValue?: string | number;
  change: string | number;
  changeType: DimensionChangeType;
  status: DimensionChangeType;
  currentValueFormatted: string;
  simulatedValueFormatted: string;
  sourceEngine: string;
  explanation: string;
  supportingSignals?: string[];
  notCalculatedReason?: string;
  unit?: string;
}

export interface RelationshipValueSnapshotDTO {
  id?: number;
  customerId: number;
  customerCode: string;
  customerName: string;
  capturedAt: string;
  snapshotDate?: string;
  relationshipValue: number;
  relationshipValueFormatted: string;
  coreScore: number;
  productDepth: number;
  engagement: number;
  serviceHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'CRITICAL' | 'POOR';
  relationshipMomentum: 'ACCELERATING' | 'STABLE' | 'DECLINING' | 'STRONG' | 'MODERATE' | 'WEAK';
  opportunityCoverage: number; // e.g. 74 (%)
  commitmentHealth: number; // e.g. 86 (%)
  activityHealth: number; // e.g. 78 (%)
  relationshipState: string;
  sourceVersion: string;
  sourceMetadata: Record<string, string>;
  dataAsOf: string;
  scenarioId?: string | null;
  decisionTraceId?: string | null;
}

export interface RelationshipValueBreakdownItem {
  category: string;
  description: string;
  value: string;
  source: string;
  impactLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface SupportingSignalItem {
  code: string;
  label: string;
  category: string;
  impact: string;
}

export interface RelationshipValueProfileDTO {
  customerId: number;
  customerCode: string;
  customerName: string;
  dataAsOf: string;
  isSimulated: boolean;
  scenarioId?: string | null;
  scenarioName?: string | null;
  decisionTraceId?: string | null;
  currentSnapshot: RelationshipValueSnapshotDTO;
  baseSnapshot: RelationshipValueSnapshotDTO;
  scenarioSnapshot?: RelationshipValueSnapshotDTO | null;
  dimensions: RelationshipDimensionItem[];
  supportingSignals: SupportingSignalItem[];
  valueBreakdown: RelationshipValueBreakdownItem[];
  explanation: string;
  limitations: string[];
}

export interface HistoricalProfilePointDTO {
  date: string;
  daysAgo: number;
  coreScore: number;
  engagement: number;
  serviceHealth: string;
  relationshipMomentum: string;
  relationshipValue: number;
  productDepth: number;
  commitmentHealth: number;
  activityHealth: number;
}

export interface RelationshipValueHistoryDTO {
  customerId: number;
  customerCode: string;
  customerName: string;
  available: boolean;
  timeline: HistoricalProfilePointDTO[];
  trendSummary: {
    coreScoreTrend: 'IMPROVED' | 'DECLINED' | 'STABLE';
    engagementTrend: 'IMPROVED' | 'DECLINED' | 'STABLE';
    serviceHealthTrend: 'IMPROVED' | 'DECLINED' | 'STABLE';
    earliestDate: string;
    latestDate: string;
    recordCount: number;
  };
  notice?: string;
}

export interface PortfolioValueDistributionBucket {
  tier: 'HIGH' | 'MEDIUM' | 'LOW';
  label: string;
  rangeLabel: string;
  customerCount: number;
  totalValue: number;
  totalValueFormatted: string;
  avgCoreScore: number;
  avgProductDepth: number;
  avgEngagement: number;
}

export interface PortfolioSegmentMetric {
  segmentKey: string;
  segmentLabel: string;
  customerCount: number;
  totalRelationshipValue: number;
  totalValueFormatted: string;
  avgCoreScore: number;
  avgProductDepth: number;
  avgEngagement: number;
  avgOpportunityCoverage: number;
  dominantServiceHealth?: string;
  serviceHealthBreakdown: {
    excellent: number;
    good: number;
    fair: number;
    critical: number;
  };
}

export interface PortfolioCustomerDrilldownItem {
  id: number;
  customerCode: string;
  customerName: string;
  segment: string;
  rmName: string;
  relationshipValue: number;
  relationshipValueFormatted: string;
  coreScore: number;
  productDepth: number;
  engagement: number;
  serviceHealth: string;
  momentum: string;
}

export interface PortfolioRelationshipValueAnalyticsDTO {
  totalCustomers: number;
  totalPortfolioValue: number;
  totalPortfolioValueFormatted: string;
  avgCoreScore: number;
  avgProductDepth: number;
  avgEngagement: number;
  avgOpportunityCoverage: number;
  overallAverages: {
    avgCoreScore: number;
    avgProductDepth: number;
    avgEngagement: number;
    avgOpportunityCoverage: number;
  };
  serviceHealthDistribution: {
    excellent: number;
    good: number;
    fair: number;
    critical: number;
  };
  distributionTiers: PortfolioValueDistributionBucket[];
  valueDistribution: PortfolioValueDistributionBucket[];
  segments: PortfolioSegmentMetric[];
  segmentsByRM: PortfolioSegmentMetric[];
  segmentsByBranch: PortfolioSegmentMetric[];
  segmentsByCustomerType: PortfolioSegmentMetric[];
  drilldownList: PortfolioCustomerDrilldownItem[];
  generatedAt: string;
}
