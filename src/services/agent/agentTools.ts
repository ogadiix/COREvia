/**
 * COREvia Phase 31: Governed Agent Tool Catalog & Tool Specifications
 * Enforces strict allowlists, read/write classification, permission rules, resource scopes, and audit events.
 * Arbitrary SQL, arbitrary CRUD, and financial mutations (fund transfers, payments, loan underwriting, balance mutations) are strictly prohibited.
 */

import { AgentActionType, AgentToolDefinition, AgentMutatingActionType, AgentReadOnlyActionType } from '../../types/agent.types.ts';

export const AGENT_ALLOWED_READ_ONLY_ACTIONS: readonly AgentReadOnlyActionType[] = [
  'GET_CUSTOMER_CONTEXT',
  'GET_CUSTOMER_360',
  'GET_CORE_SCORE',
  'GET_RELATIONSHIP_HEALTH',
  'GET_ACTIVE_SIGNALS',
  'GET_OPPORTUNITIES',
  'GET_SERVICE_CASES',
  'GET_TASKS',
  'GET_INTERACTIONS',
  'GET_COMMITMENTS',
  'GET_RELATIONSHIP_REVIEWS',
  'GET_DOCUMENT_STATUS',
  'GET_RELATIONSHIP_GRAPH',
  'GET_DECISION_TRACE',
  'SIMULATE_STRATEGY',
  'GET_RELATIONSHIP_VALUE_PROFILE',
  'COMPARE_RELATIONSHIP_VALUE_SCENARIO',
] as const;

export const AGENT_ALLOWED_MUTATIONS: readonly AgentMutatingActionType[] = [
  'CREATE_TASK',
  'UPDATE_TASK',
  'CREATE_INTERACTION',
  'CREATE_RELATIONSHIP_REVIEW',
  'CREATE_FOLLOW_UP',
  'UPDATE_OPPORTUNITY',
  'UPDATE_SERVICE_CASE',
  'CREATE_NOTIFICATION',
] as const;

export const AGENT_BANNED_FINANCIAL_ACTIONS = [
  'TRANSFER_FUNDS',
  'SEND_MONEY',
  'INITIATE_PAYMENT',
  'APPROVE_LOAN',
  'CHANGE_CREDIT_LIMIT',
  'CHANGE_INTEREST_RATE',
  'CLOSE_ACCOUNT',
  'MODIFY_BALANCE',
  'EXECUTE_SQL',
  'DROP_TABLE',
  'MUTATE_DATABASE_DIRECT',
] as const;

export const AGENT_TOOL_REGISTRY: Record<AgentActionType, AgentToolDefinition> = {
  // ================= READ-ONLY ACTIONS =================
  GET_CUSTOMER_CONTEXT: {
    name: 'GET_CUSTOMER_CONTEXT',
    description: 'Retrieve high-level authorized customer identification, risk rating, and RM assignment.',
    isMutation: false,
    requiredPermission: 'customer:read',
    resourceType: 'CUSTOMER',
    auditAction: 'AGENT_TOOL_CALLED',
    requiresConfirmation: false,
    idempotencyRequired: false,
    inputSchema: {
      type: 'object',
      properties: { customerId: { type: ['number', 'string'] } },
      required: ['customerId'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        customerId: { type: 'number' },
        customerCode: { type: 'string' },
        name: { type: 'string' },
        cifNumber: { type: 'string' },
        riskRating: { type: 'string' },
        tier: { type: 'string' },
      },
    },
  },

  GET_CUSTOMER_360: {
    name: 'GET_CUSTOMER_360',
    description: 'Retrieve authorized Customer 360 overview including financial profile and linked accounts summary.',
    isMutation: false,
    requiredPermission: 'customer:read',
    resourceType: 'CUSTOMER',
    auditAction: 'AGENT_TOOL_CALLED',
    requiresConfirmation: false,
    idempotencyRequired: false,
    inputSchema: {
      type: 'object',
      properties: { customerId: { type: ['number', 'string'] } },
      required: ['customerId'],
    },
    outputSchema: {
      type: 'object',
      properties: { customer: { type: 'object' }, financialSummary: { type: 'object' } },
    },
  },

  GET_CORE_SCORE: {
    name: 'GET_CORE_SCORE',
    description: 'Retrieve real-time CORE relationship score, health band, momentum, and risk tier.',
    isMutation: false,
    requiredPermission: 'analytics:read',
    resourceType: 'CORE_SCORE',
    auditAction: 'AGENT_TOOL_CALLED',
    requiresConfirmation: false,
    idempotencyRequired: false,
    inputSchema: {
      type: 'object',
      properties: { customerId: { type: ['number', 'string'] } },
      required: ['customerId'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        score: { type: 'number' },
        band: { type: 'string' },
        trend: { type: 'string' },
        momentum: { type: 'string' },
        factors: { type: 'array' },
      },
    },
  },

  GET_RELATIONSHIP_HEALTH: {
    name: 'GET_RELATIONSHIP_HEALTH',
    description: 'Retrieve relationship health breakdown, churn risk score, and engagement velocity.',
    isMutation: false,
    requiredPermission: 'customer:read',
    resourceType: 'RELATIONSHIP_HEALTH',
    auditAction: 'AGENT_TOOL_CALLED',
    requiresConfirmation: false,
    idempotencyRequired: false,
    inputSchema: {
      type: 'object',
      properties: { customerId: { type: ['number', 'string'] } },
      required: ['customerId'],
    },
    outputSchema: {
      type: 'object',
      properties: { healthScore: { type: 'number' }, riskFactor: { type: 'string' } },
    },
  },

  GET_ACTIVE_SIGNALS: {
    name: 'GET_ACTIVE_SIGNALS',
    description: 'Retrieve active early-warning relationship signals (attrition risk, momentum decline, deposit drop).',
    isMutation: false,
    requiredPermission: 'customer:read',
    resourceType: 'SIGNAL',
    auditAction: 'AGENT_TOOL_CALLED',
    requiresConfirmation: false,
    idempotencyRequired: false,
    inputSchema: {
      type: 'object',
      properties: { customerId: { type: ['number', 'string'] } },
      required: ['customerId'],
    },
    outputSchema: {
      type: 'object',
      properties: { signals: { type: 'array' }, count: { type: 'number' } },
    },
  },

  GET_OPPORTUNITIES: {
    name: 'GET_OPPORTUNITIES',
    description: 'Retrieve pipeline opportunities for the customer including stalled and active deals.',
    isMutation: false,
    requiredPermission: 'opportunity:read',
    resourceType: 'OPPORTUNITY',
    auditAction: 'AGENT_TOOL_CALLED',
    requiresConfirmation: false,
    idempotencyRequired: false,
    inputSchema: {
      type: 'object',
      properties: { customerId: { type: ['number', 'string'] }, stage: { type: 'string' } },
      required: ['customerId'],
    },
    outputSchema: {
      type: 'object',
      properties: { opportunities: { type: 'array' } },
    },
  },

  GET_SERVICE_CASES: {
    name: 'GET_SERVICE_CASES',
    description: 'Retrieve service desk tickets and complaints with status, priority, and resolution details.',
    isMutation: false,
    requiredPermission: 'case:read',
    resourceType: 'SERVICE_CASE',
    auditAction: 'AGENT_TOOL_CALLED',
    requiresConfirmation: false,
    idempotencyRequired: false,
    inputSchema: {
      type: 'object',
      properties: { customerId: { type: ['number', 'string'] }, status: { type: 'string' } },
      required: ['customerId'],
    },
    outputSchema: {
      type: 'object',
      properties: { cases: { type: 'array' } },
    },
  },

  GET_TASKS: {
    name: 'GET_TASKS',
    description: 'Retrieve actionable banker tasks and follow-ups associated with the customer.',
    isMutation: false,
    requiredPermission: 'task:read',
    resourceType: 'TASK',
    auditAction: 'AGENT_TOOL_CALLED',
    requiresConfirmation: false,
    idempotencyRequired: false,
    inputSchema: {
      type: 'object',
      properties: { customerId: { type: ['number', 'string'] }, status: { type: 'string' } },
      required: ['customerId'],
    },
    outputSchema: {
      type: 'object',
      properties: { tasks: { type: 'array' } },
    },
  },

  GET_INTERACTIONS: {
    name: 'GET_INTERACTIONS',
    description: 'Retrieve past client meetings, calls, reviews, and officer interaction log history.',
    isMutation: false,
    requiredPermission: 'customer:read',
    resourceType: 'INTERACTION',
    auditAction: 'AGENT_TOOL_CALLED',
    requiresConfirmation: false,
    idempotencyRequired: false,
    inputSchema: {
      type: 'object',
      properties: { customerId: { type: ['number', 'string'] }, limit: { type: 'number' } },
      required: ['customerId'],
    },
    outputSchema: {
      type: 'object',
      properties: { interactions: { type: 'array' } },
    },
  },

  GET_COMMITMENTS: {
    name: 'GET_COMMITMENTS',
    description: 'Retrieve banker-to-customer commitments, promises made, and SLA due dates.',
    isMutation: false,
    requiredPermission: 'customer:read',
    resourceType: 'COMMITMENT',
    auditAction: 'AGENT_TOOL_CALLED',
    requiresConfirmation: false,
    idempotencyRequired: false,
    inputSchema: {
      type: 'object',
      properties: { customerId: { type: ['number', 'string'] } },
      required: ['customerId'],
    },
    outputSchema: {
      type: 'object',
      properties: { commitments: { type: 'array' } },
    },
  },

  GET_RELATIONSHIP_REVIEWS: {
    name: 'GET_RELATIONSHIP_REVIEWS',
    description: 'Retrieve formal relationship review schedules, past review outcomes, and next governance date.',
    isMutation: false,
    requiredPermission: 'customer:read',
    resourceType: 'RELATIONSHIP_REVIEW',
    auditAction: 'AGENT_TOOL_CALLED',
    requiresConfirmation: false,
    idempotencyRequired: false,
    inputSchema: {
      type: 'object',
      properties: { customerId: { type: ['number', 'string'] } },
      required: ['customerId'],
    },
    outputSchema: {
      type: 'object',
      properties: { reviews: { type: 'array' }, lastReviewDate: { type: 'string' } },
    },
  },

  GET_DOCUMENT_STATUS: {
    name: 'GET_DOCUMENT_STATUS',
    description: 'Check KYC, FATCA, facility agreements, and customer verification document statuses.',
    isMutation: false,
    requiredPermission: 'document:read',
    resourceType: 'DOCUMENT',
    auditAction: 'AGENT_TOOL_CALLED',
    requiresConfirmation: false,
    idempotencyRequired: false,
    inputSchema: {
      type: 'object',
      properties: { customerId: { type: ['number', 'string'] } },
      required: ['customerId'],
    },
    outputSchema: {
      type: 'object',
      properties: { documents: { type: 'array' }, pendingCount: { type: 'number' } },
    },
  },

  GET_RELATIONSHIP_GRAPH: {
    name: 'GET_RELATIONSHIP_GRAPH',
    description: 'Inspect authorized multi-entity relationship graph nodes (accounts, entities, related parties).',
    isMutation: false,
    requiredPermission: 'graph:read',
    resourceType: 'RELATIONSHIP_GRAPH',
    auditAction: 'AGENT_TOOL_CALLED',
    requiresConfirmation: false,
    idempotencyRequired: false,
    inputSchema: {
      type: 'object',
      properties: { customerId: { type: ['number', 'string'] }, maxDepth: { type: 'number' } },
      required: ['customerId'],
    },
    outputSchema: {
      type: 'object',
      properties: { nodes: { type: 'array' }, edges: { type: 'array' } },
    },
  },

  GET_DECISION_TRACE: {
    name: 'GET_DECISION_TRACE',
    description: 'Retrieve deterministic decision trace evidence, rule evaluations, and mathematical audit trail.',
    isMutation: false,
    requiredPermission: 'analytics:read',
    resourceType: 'DECISION_TRACE',
    auditAction: 'AGENT_TOOL_CALLED',
    requiresConfirmation: false,
    idempotencyRequired: false,
    inputSchema: {
      type: 'object',
      properties: { traceId: { type: 'string' }, customerId: { type: ['number', 'string'] } },
    },
    outputSchema: {
      type: 'object',
      properties: { traceId: { type: 'string' }, evidence: { type: 'array' }, recommendation: { type: 'object' } },
    },
  },

  SIMULATE_STRATEGY: {
    name: 'SIMULATE_STRATEGY',
    description: 'Execute deterministic what-if relationship simulation without mutating live banking data.',
    isMutation: false,
    requiredPermission: 'analytics:read',
    resourceType: 'STRATEGY_SCENARIO',
    auditAction: 'AGENT_TOOL_CALLED',
    requiresConfirmation: false,
    idempotencyRequired: false,
    inputSchema: {
      type: 'object',
      properties: { customerId: { type: ['number', 'string'] }, actions: { type: 'array' } },
      required: ['customerId', 'actions'],
    },
    outputSchema: {
      type: 'object',
      properties: { projectedScore: { type: 'number' }, projectedBand: { type: 'string' }, deltas: { type: 'array' } },
    },
  },

  GET_RELATIONSHIP_VALUE_PROFILE: {
    name: 'GET_RELATIONSHIP_VALUE_PROFILE',
    description: 'Retrieve deterministic multidimensional relationship value snapshot across 10 core dimensions.',
    isMutation: false,
    requiredPermission: 'customer:read',
    resourceType: 'RELATIONSHIP_VALUE',
    auditAction: 'AGENT_TOOL_CALLED',
    requiresConfirmation: false,
    idempotencyRequired: false,
    inputSchema: {
      type: 'object',
      properties: { customerId: { type: ['number', 'string'] } },
      required: ['customerId'],
    },
    outputSchema: {
      type: 'object',
      properties: { coreScore: { type: 'number' }, relationshipValueFormatted: { type: 'string' }, dimensions: { type: 'array' } },
    },
  },

  COMPARE_RELATIONSHIP_VALUE_SCENARIO: {
    name: 'COMPARE_RELATIONSHIP_VALUE_SCENARIO',
    description: 'Compare current relationship profile against simulated strategy scenario across 10 dimensions without mutating live data.',
    isMutation: false,
    requiredPermission: 'analytics:read',
    resourceType: 'RELATIONSHIP_VALUE',
    auditAction: 'AGENT_TOOL_CALLED',
    requiresConfirmation: false,
    idempotencyRequired: false,
    inputSchema: {
      type: 'object',
      properties: { customerId: { type: ['number', 'string'] }, scenarioId: { type: 'string' } },
      required: ['customerId', 'scenarioId'],
    },
    outputSchema: {
      type: 'object',
      properties: { baseScore: { type: 'number' }, scenarioScore: { type: 'number' }, dimensions: { type: 'array' } },
    },
  },

  // ================= MUTATING ACTIONS (STRICT GOVERNANCE) =================
  CREATE_TASK: {
    name: 'CREATE_TASK',
    description: 'Create an actionable relationship banker task with explicit due date and priority.',
    isMutation: true,
    requiredPermission: 'task:create',
    resourceType: 'TASK',
    auditAction: 'AGENT_ACTION_EXECUTED',
    requiresConfirmation: true,
    idempotencyRequired: true,
    inputSchema: {
      type: 'object',
      properties: {
        customerId: { type: ['number', 'string'] },
        title: { type: 'string' },
        description: { type: 'string' },
        dueDate: { type: 'string' },
        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
        assignedToId: { type: 'number' },
      },
      required: ['customerId', 'title', 'dueDate'],
    },
    outputSchema: {
      type: 'object',
      properties: { taskId: { type: 'number' }, status: { type: 'string' } },
    },
  },

  UPDATE_TASK: {
    name: 'UPDATE_TASK',
    description: 'Update the status or notes of an existing relationship task.',
    isMutation: true,
    requiredPermission: 'task:update',
    resourceType: 'TASK',
    auditAction: 'AGENT_ACTION_EXECUTED',
    requiresConfirmation: true,
    idempotencyRequired: true,
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: ['number', 'string'] },
        status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
        description: { type: 'string' },
        priority: { type: 'string' },
      },
      required: ['taskId'],
    },
    outputSchema: {
      type: 'object',
      properties: { taskId: { type: 'number' }, status: { type: 'string' } },
    },
  },

  CREATE_INTERACTION: {
    name: 'CREATE_INTERACTION',
    description: 'Record an official customer touchpoint, banker meeting, call summary, or outreach log.',
    isMutation: true,
    requiredPermission: 'customer:update',
    resourceType: 'INTERACTION',
    auditAction: 'AGENT_ACTION_EXECUTED',
    requiresConfirmation: true,
    idempotencyRequired: true,
    inputSchema: {
      type: 'object',
      properties: {
        customerId: { type: ['number', 'string'] },
        type: { type: 'string' },
        channel: { type: 'string' },
        subject: { type: 'string' },
        summary: { type: 'string' },
        sentiment: { type: 'string' },
      },
      required: ['customerId', 'subject', 'summary'],
    },
    outputSchema: {
      type: 'object',
      properties: { interactionId: { type: 'number' } },
    },
  },

  CREATE_RELATIONSHIP_REVIEW: {
    name: 'CREATE_RELATIONSHIP_REVIEW',
    description: 'Schedule a formal relationship review cadence meeting and record governance tracking review.',
    isMutation: true,
    requiredPermission: 'customer:update',
    resourceType: 'RELATIONSHIP_REVIEW',
    auditAction: 'AGENT_ACTION_EXECUTED',
    requiresConfirmation: true,
    idempotencyRequired: true,
    inputSchema: {
      type: 'object',
      properties: {
        customerId: { type: ['number', 'string'] },
        title: { type: 'string' },
        scheduledDate: { type: 'string' },
        reviewScope: { type: 'string' },
        priority: { type: 'string' },
      },
      required: ['customerId', 'title'],
    },
    outputSchema: {
      type: 'object',
      properties: { reviewId: { type: 'string' }, taskId: { type: 'number' } },
    },
  },

  CREATE_FOLLOW_UP: {
    name: 'CREATE_FOLLOW_UP',
    description: 'Create an expedited follow-up action item attached to a customer conversation or ticket.',
    isMutation: true,
    requiredPermission: 'task:create',
    resourceType: 'FOLLOW_UP',
    auditAction: 'AGENT_ACTION_EXECUTED',
    requiresConfirmation: true,
    idempotencyRequired: true,
    inputSchema: {
      type: 'object',
      properties: {
        customerId: { type: ['number', 'string'] },
        title: { type: 'string' },
        dueDate: { type: 'string' },
        notes: { type: 'string' },
        channel: { type: 'string' },
      },
      required: ['customerId', 'title', 'dueDate'],
    },
    outputSchema: {
      type: 'object',
      properties: { taskId: { type: 'number' }, title: { type: 'string' } },
    },
  },

  UPDATE_OPPORTUNITY: {
    name: 'UPDATE_OPPORTUNITY',
    description: 'Update the pipeline stage, probability, or progress notes of a commercial opportunity.',
    isMutation: true,
    requiredPermission: 'opportunity:update',
    resourceType: 'OPPORTUNITY',
    auditAction: 'AGENT_ACTION_EXECUTED',
    requiresConfirmation: true,
    idempotencyRequired: true,
    inputSchema: {
      type: 'object',
      properties: {
        opportunityId: { type: ['number', 'string'] },
        stage: { type: 'string', enum: ['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'] },
        notes: { type: 'string' },
        probability: { type: 'number' },
      },
      required: ['opportunityId'],
    },
    outputSchema: {
      type: 'object',
      properties: { opportunityId: { type: 'number' }, stage: { type: 'string' } },
    },
  },

  UPDATE_SERVICE_CASE: {
    name: 'UPDATE_SERVICE_CASE',
    description: 'Update service ticket status, resolution summary, or operational priority.',
    isMutation: true,
    requiredPermission: 'case:update',
    resourceType: 'SERVICE_CASE',
    auditAction: 'AGENT_ACTION_EXECUTED',
    requiresConfirmation: true,
    idempotencyRequired: true,
    inputSchema: {
      type: 'object',
      properties: {
        caseId: { type: ['number', 'string'] },
        status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED'] },
        resolutionSummary: { type: 'string' },
        priority: { type: 'string' },
      },
      required: ['caseId'],
    },
    outputSchema: {
      type: 'object',
      properties: { caseId: { type: 'number' }, status: { type: 'string' } },
    },
  },

  CREATE_NOTIFICATION: {
    name: 'CREATE_NOTIFICATION',
    description: 'Send an in-app operational notification or banker alert regarding plan progression.',
    isMutation: true,
    requiredPermission: 'notification:create',
    resourceType: 'NOTIFICATION',
    auditAction: 'AGENT_ACTION_EXECUTED',
    requiresConfirmation: true,
    idempotencyRequired: true,
    inputSchema: {
      type: 'object',
      properties: {
        recipientUserId: { type: 'number' },
        title: { type: 'string' },
        message: { type: 'string' },
        type: { type: 'string' },
        priority: { type: 'string' },
      },
      required: ['title', 'message'],
    },
    outputSchema: {
      type: 'object',
      properties: { notificationId: { type: 'number' } },
    },
  },
};

/**
 * Validates whether an action name is strictly allowlisted
 */
export function isAllowlistedAction(action: string): action is AgentActionType {
  return (
    AGENT_ALLOWED_READ_ONLY_ACTIONS.includes(action as AgentReadOnlyActionType) ||
    AGENT_ALLOWED_MUTATIONS.includes(action as AgentMutatingActionType)
  );
}

/**
 * Checks whether an action is mutating (requiring confirmation by default)
 */
export function isMutatingAction(action: string): boolean {
  return AGENT_ALLOWED_MUTATIONS.includes(action as AgentMutatingActionType);
}

/**
 * Validates if an action is explicitly blocked due to financial safety rules
 */
export function isBannedFinancialAction(action: string): boolean {
  const upper = String(action || '').toUpperCase();
  return AGENT_BANNED_FINANCIAL_ACTIONS.some(banned => upper.includes(banned));
}

/**
 * Returns the tool definition for an action
 */
export function getAgentToolDefinition(action: AgentActionType): AgentToolDefinition {
  const def = AGENT_TOOL_REGISTRY[action];
  if (!def) {
    throw new Error(`Agent tool definition for action '${action}' not found in registry.`);
  }
  return def;
}
