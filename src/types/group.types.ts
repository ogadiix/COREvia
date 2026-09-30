/**
 * COREvia Phase 34: Household & Business Group 360 Types
 * Governed group relationship intelligence schemas, member authorization models,
 * group profile aggregations, timelines, and analytics.
 */

export type GroupType = 'HOUSEHOLD' | 'BUSINESS' | 'BUSINESS_GROUP';

export type GroupStatus = 'ACTIVE' | 'INACTIVE' | 'UNDER_REVIEW' | 'ARCHIVED';

export type GroupEntityType = 'CUSTOMER' | 'BUSINESS';

export type GroupRelationshipType =
  | 'HOUSEHOLD_MEMBER'
  | 'HEAD_OF_FAMILY'
  | 'SPOUSE'
  | 'DEPENDENT'
  | 'PARENT'
  | 'CHILD'
  | 'OWNER'
  | 'DIRECTOR'
  | 'SHAREHOLDER'
  | 'PARTNER'
  | 'AUTHORIZED_SIGNATORY'
  | 'BENEFICIAL_OWNER'
  | 'KEY_PERSON'
  | 'RELATED_BUSINESS'
  | 'OTHER';

export interface GroupMemberDTO {
  id: number;
  groupId: number;
  entityType: GroupEntityType;
  entityId: string;
  role: string;
  relationshipType: GroupRelationshipType;
  ownershipPercentage?: number | null;
  isPrimary: boolean;
  validFrom?: string | null;
  validTo?: string | null;
  name: string;
  code?: string;
  cifNumber?: string;
  isAuthorized: boolean;
  coreScore?: number | null;
  relationshipValue?: number | null;
  formattedRelationshipValue?: string;
  segment?: string;
  status?: string;
  occupationOrSector?: string;
  accountsCount?: number;
  loansCount?: number;
  productsCount?: number;
  openCasesCount?: number;
  openOpportunitiesCount?: number;
  activeJourneysCount?: number;
  metadata?: Record<string, any> | null;
}

export interface GroupRelationshipValueProfile {
  totalValue: number | null;
  formattedValue: string;
  isAvailable: boolean;
  authorizedMemberCount: number;
  totalMemberCount: number;
  hasRestrictedMembers: boolean;
  breakdown: Array<{
    memberId: string;
    memberName: string;
    role: string;
    value: number | null;
    formattedValue: string;
    isAuthorized: boolean;
  }>;
}

export interface GroupCoreProfile {
  averageScore: number | null;
  minScore: number | null;
  maxScore: number | null;
  scoreRange: string;
  distribution: {
    excellent: number; // 80+
    good: number; // 70-79
    moderate: number; // 50-69
    needsAttention: number; // <50
  };
  summary: string;
}

export interface GroupProductDepth {
  uniqueProductsCount: number;
  totalProductRelationships: number;
  categories: Array<{ category: string; count: number }>;
  uniqueProducts: Array<{
    productId: number;
    productName: string;
    productCategory: string;
    assignedMembers: Array<{ id: string; name: string }>;
  }>;
}

export interface GroupServiceHealth {
  openCases: number;
  criticalCases: number;
  atRiskCases: number;
  breachedCases: number;
  resolvedRecently: number;
  cases: Array<{
    id: number;
    caseNumber: string;
    title: string;
    priority: string;
    status: string;
    customerId: number;
    customerName: string;
    slaDueDate?: string | null;
    isBreached: boolean;
  }>;
}

export interface GroupOpportunityPipeline {
  openCount: number;
  pipelineValue: number;
  formattedPipelineValue: string;
  stalledCount: number;
  recentlyUpdatedCount: number;
  byMember: Array<{ memberId: string; memberName: string; count: number; value: number }>;
  opportunities: Array<{
    id: number;
    title: string;
    stage: string;
    estimatedValue?: number | null;
    customerId: number;
    customerName: string;
    probability?: number | null;
    expectedCloseDate?: string | null;
  }>;
}

export interface GroupActiveJourneys {
  totalCount: number;
  activeCount: number;
  blockedCount: number;
  atRiskCount: number;
  completedCount: number;
  journeys: Array<{
    id: number;
    journeyId: string;
    name: string;
    journeyType: string;
    status: string;
    slaStatus: string;
    customerId: number;
    customerName: string;
    blockedReason?: string | null;
    progressPercentage: number;
  }>;
}

export interface GroupTimelineEventDTO {
  id: string | number;
  timestamp: string;
  entity: string;
  entityId: string;
  interactionType: string;
  title: string;
  description: string;
  owner: string;
  source: string;
}

export interface GroupSignalsProfile {
  totalActiveSignals: number;
  criticalCount: number;
  signals: Array<{
    id: number;
    customerId: number;
    customerName: string;
    signalType: string;
    title: string;
    description: string;
    severity: string;
    detectedAt: string;
  }>;
}

export interface GroupProfileDTO {
  groupId: string;
  groupName: string;
  groupType: GroupType;
  relationshipValue: GroupRelationshipValueProfile;
  coreProfile: GroupCoreProfile;
  productDepth: GroupProductDepth;
  serviceHealth: GroupServiceHealth;
  opportunities: GroupOpportunityPipeline;
  activeJourneys: GroupActiveJourneys;
  signals: GroupSignalsProfile;
  engagement: {
    totalInteractionsLast90Days: number;
    lastInteractionDate: string | null;
  };
}

export interface RelationshipGroupDTO {
  id: number;
  groupId: string;
  groupType: GroupType;
  name: string;
  displayName: string;
  description?: string | null;
  status: GroupStatus;
  primaryCustomerId?: number | null;
  primaryCustomerName?: string | null;
  primaryCustomerCode?: string | null;
  primaryBusinessId?: string | null;
  primaryBusinessName?: string | null;
  relationshipManagerId?: number | null;
  relationshipManagerName?: string | null;
  relationshipManagerRole?: string | null;
  totalMembersCount: number;
  authorizedMembersCount: number;
  hasRestrictedMembers: boolean;
  members: GroupMemberDTO[];
  profile?: GroupProfileDTO;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface GroupAnalyticsDTO {
  totalGroups: number;
  totalHouseholds: number;
  totalBusinessGroups: number;
  totalGroupRelationshipValue: number;
  formattedTotalValue: string;
  avgMembersPerGroup: number;
  openCasesAcrossGroups: number;
  pipelineValueAcrossGroups: number;
  activeJourneysAcrossGroups: number;
  byType: Array<{ type: GroupType; label: string; count: number; value: number }>;
  byStatus: Record<string, number>;
  topGroupsByValue: Array<{ id: number; groupId: string; name: string; type: GroupType; value: number }>;
}

export interface CreateGroupPayload {
  groupId?: string;
  groupType: GroupType;
  name: string;
  displayName?: string;
  description?: string;
  primaryCustomerId?: number;
  primaryBusinessId?: string;
  relationshipManagerId?: number;
  members?: Array<{
    entityType: GroupEntityType;
    entityId: string;
    role: string;
    relationshipType: GroupRelationshipType;
    ownershipPercentage?: number;
    isPrimary?: boolean;
    validFrom?: string;
    validTo?: string;
  }>;
  metadata?: Record<string, any>;
}

export interface UpdateGroupPayload {
  name?: string;
  displayName?: string;
  description?: string;
  status?: GroupStatus;
  primaryCustomerId?: number;
  primaryBusinessId?: string;
  relationshipManagerId?: number;
  metadata?: Record<string, any>;
}

export interface AddGroupMemberPayload {
  entityType: GroupEntityType;
  entityId: string;
  role: string;
  relationshipType: GroupRelationshipType;
  ownershipPercentage?: number;
  isPrimary?: boolean;
  validFrom?: string;
  validTo?: string;
  metadata?: Record<string, any>;
}

export interface HandoffGroupPayload {
  targetUserId: number;
  targetRole?: string;
  reason: string;
}

export interface GroupFilterParams {
  groupType?: GroupType;
  status?: GroupStatus;
  relationshipManagerId?: number;
  search?: string;
  limit?: number;
  offset?: number;
}
