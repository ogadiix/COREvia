export type GraphEntityType =
  | 'CUSTOMER'
  | 'HOUSEHOLD'
  | 'BUSINESS'
  | 'ACCOUNT'
  | 'LOAN'
  | 'PRODUCT'
  | 'OPPORTUNITY'
  | 'SERVICE_CASE'
  | 'INTERACTION'
  | 'TASK'
  | 'RELATIONSHIP_REVIEW'
  | 'ONBOARDING_APPLICATION'
  | 'DOCUMENT'
  | 'SIGNAL'
  | 'COMMITMENT'
  | 'RELATIONSHIP_STATE';

export type GraphRelationshipType =
  | 'CUSTOMER_BELONGS_TO_HOUSEHOLD'
  | 'CUSTOMER_ASSOCIATED_WITH_BUSINESS'
  | 'CUSTOMER_OWNS_ACCOUNT'
  | 'CUSTOMER_HAS_LOAN'
  | 'CUSTOMER_HAS_PRODUCT'
  | 'CUSTOMER_HAS_OPPORTUNITY'
  | 'CUSTOMER_HAS_SERVICE_CASE'
  | 'CUSTOMER_HAS_INTERACTION'
  | 'CUSTOMER_HAS_TASK'
  | 'CUSTOMER_HAS_REVIEW'
  | 'CUSTOMER_HAS_ONBOARDING'
  | 'CUSTOMER_HAS_DOCUMENT'
  | 'CUSTOMER_HAS_SIGNAL'
  | 'CUSTOMER_HAS_COMMITMENT'
  | 'CUSTOMER_HAS_RELATIONSHIP_STATE'
  | 'ACCOUNT_USES_PRODUCT'
  | 'LOAN_USES_PRODUCT'
  | 'CASE_HAS_INTERACTION'
  | 'CASE_HAS_TASK'
  | 'OPPORTUNITY_HAS_INTERACTION'
  | 'OPPORTUNITY_HAS_TASK'
  | 'INTERACTION_GENERATED_TASK'
  | 'INTERACTION_HAS_COMMITMENT'
  | 'DOCUMENT_SUPPORTS_CASE'
  | 'DOCUMENT_SUPPORTS_LOAN'
  | 'DOCUMENT_SUPPORTS_ONBOARDING'
  | 'DOCUMENT_SUPPORTS_OPPORTUNITY';

export type GraphProvenanceType =
  | 'DIRECT_RECORD'
  | 'DERIVED_FROM_ACCOUNT_OWNERSHIP'
  | 'DERIVED_FROM_CASE'
  | 'DERIVED_FROM_INTERACTION'
  | 'DERIVED_FROM_OPPORTUNITY'
  | 'DERIVED_FROM_REVIEW'
  | 'DERIVED_FROM_ONBOARDING'
  | 'DERIVED_FROM_DOCUMENT'
  | 'DERIVED_FROM_SIGNAL'
  | 'DERIVED_FROM_EXISTING_RELATIONSHIP_ENGINE';

export interface GraphNodeDTO {
  id: string; // e.g. "customer:1" or "account:10"
  entityType: GraphEntityType;
  entityId: string | number;
  code: string;
  label: string;
  sublabel?: string;
  status: string;
  depth: number;
  isRoot: boolean;
  metrics?: Record<string, any>;
  metadata?: Record<string, any>;
  operationalPriority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL';
  iconName?: string;
}

export interface GraphEdgeDTO {
  id: string;
  source: string; // source node id
  target: string; // target node id
  relationshipType: GraphRelationshipType;
  status: string;
  provenanceType: GraphProvenanceType;
  provenanceId?: string | null;
  explanation: string;
  evidence?: string | null;
  visibilityScope: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface GraphWhatChangedItem {
  id: string | number;
  title: string;
  summary: string;
  category: string;
  timestamp: string;
  severity?: string;
  sourceEngine?: string;
}

export interface RelationshipGraphResponse {
  root: GraphNodeDTO;
  nodes: GraphNodeDTO[];
  edges: GraphEdgeDTO[];
  meta: {
    depth: number;
    nodeCount: number;
    edgeCount: number;
    generatedAt: string;
    truncated: boolean;
    entityTypeCounts: Record<string, number>;
    relationshipTypeCounts: Record<string, number>;
  };
  whatChanged?: {
    recentEventsCount: number;
    items: GraphWhatChangedItem[];
    lastEventAt?: string;
  };
}

export interface GraphPathResponse {
  found: boolean;
  pathLength: number;
  nodes: GraphNodeDTO[];
  edges: GraphEdgeDTO[];
  explanation: string;
}

export interface GraphAnalyticsSummary {
  totalNodes: number;
  totalEdges: number;
  averageDegree: number;
  nodesByType: Record<string, number>;
  edgesByType: Record<string, number>;
  mostConnectedEntities: Array<{
    id: string;
    label: string;
    type: GraphEntityType;
    degree: number;
  }>;
}

export interface GraphQueryParams {
  depth?: number;
  nodeTypes?: string[];
  relationshipTypes?: string[];
  includeSignals?: boolean;
  includeOperationalContext?: boolean;
  limit?: number;
}

export interface GraphEvidenceDTO {
  edgeId: string;
  source: {
    entityType: GraphEntityType;
    entityId: string | number;
    code: string;
    label: string;
  };
  target: {
    entityType: GraphEntityType;
    entityId: string | number;
    code: string;
    label: string;
  };
  relationshipType: GraphRelationshipType;
  relationshipStrength?: 'PRIMARY' | 'HIGH' | 'MEDIUM' | 'OPERATIONAL' | 'STANDARD';
  status: string;
  createdAt: string;
  updatedAt: string;
  sourceRecord: {
    tableName: string;
    recordId: string | number;
    status?: string;
  };
  provenance: {
    provenanceType: GraphProvenanceType;
    provenanceId?: string | null;
    explanation: string;
    evidence?: string | null;
  };
  authorization: {
    authorized: boolean;
    requestingUser: string;
    role: string;
    employeeId: string;
  };
  audit: {
    retrievedAt: string;
    requestId: string;
    dataSource: string;
    regulatoryAuditStatus: string;
  };
}
