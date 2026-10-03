import { FunctionDeclaration, Type } from '@google/genai';
import { customerService } from '../customer.service.ts';
import { taskService } from '../task.service.ts';
import { caseService } from '../case.service.ts';
import { opportunityService } from '../opportunity.service.ts';
import { nextBestActionService } from '../nextBestAction.service.ts';
import { relationshipIntelligenceService } from '../relationshipIntelligence.service.ts';
import { opportunityRadarService } from '../opportunityRadar.service.ts';
import { financialRelationshipService } from '../financialRelationship.service.ts';
import { interactionService } from '../interaction.service.ts';
import { notificationService } from '../notification.service.ts';
import { analyticsService } from '../analytics.service.ts';
import { documentService } from '../document.service.ts';
import { relationshipTwinService } from '../relationshipTwin.service.ts';
import { relationshipGraphService } from '../relationshipGraph.service.ts';
import { decisionTraceService } from '../decisionTrace.service.ts';
import { strategySimulatorService } from '../strategySimulator.service.ts';
import { agentPlanningService } from '../agent/agentPlanning.service.ts';
import { agentExecutionService } from '../agent/agentExecution.service.ts';
import { agentRepository } from '../../repositories/agent.repository.ts';
import { relationshipValueService } from '../relationshipValue.service.ts';
import { journeyService } from '../journey.service.ts';
import { groupService } from '../group.service.ts';
import { governanceService } from '../governance.service.ts';
import { operationsService } from '../operations.service.ts';
import { portfolioIntelligenceService } from '../portfolioIntelligence.service.ts';
import { integrationService } from '../integrations/integration.service.ts';
import { pendingActionService } from './pendingActions.ts';
import { CopilotSource } from './types.ts';
import { auditRepository } from '../../repositories/audit.repository.ts';
import { BankingError } from '../../lib/errors.ts';
import { copilotSecurity } from './security.ts';

export interface ToolExecutionContext {
  user: {
    id: number;
    name: string;
    employeeId: string;
    role: string;
    department?: string;
    permissions: string[];
  };
  requestId: string;
  contextCustomerCode?: string;
}

export interface ToolResult {
  data: any;
  sources: CopilotSource[];
  pendingConfirmation?: any;
}

export const COPILOT_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'searchCustomer',
    description: 'Search authorized bank customers by name, CIF, customer code, or PAN.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Customer search keyword, name, or code (e.g. Rahul Sharma or CUS-10482)' },
        limit: { type: Type.INTEGER, description: 'Max number of results to return (default 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'getCustomer360',
    description: 'Retrieve complete Customer 360 overview including profile, segment, relationship value, CORE score, and products count.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Customer Code (e.g. CUS-10482 or 1)' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'getCustomerAccounts',
    description: 'Retrieve authorized bank deposit and savings accounts for a customer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Code' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'getCustomerLoans',
    description: 'Retrieve active advances, credit facilities, and loans for a customer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Code' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'getCustomerProducts',
    description: 'Retrieve active product holdings and portfolio summary for a customer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Code' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'getCustomerCases',
    description: 'Retrieve service requests, grievances, and SLA tracking for a customer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Code' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'getCustomerInteractions',
    description: 'Retrieve past meetings, calls, and officer touchpoints for a customer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Code' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'getCustomerOpportunities',
    description: 'Retrieve active commercial opportunities and pipeline for a customer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Code' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'getCustomerTasks',
    description: 'Retrieve outstanding officer tasks and follow-ups for a customer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Code' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'getCustomerScore',
    description: 'Retrieve the verified CORE Score and dimensional factors (Financial Health, Credit Risk, Engagement).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Code' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'getCustomerScoreHistory',
    description: 'Retrieve historical CORE score movement and momentum drivers.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Code' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'getCustomerInsights',
    description: 'Retrieve active Relationship Intelligence signals and risk alerts for a customer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Code' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'getCustomerNextBestActions',
    description: 'Retrieve deterministic Next Best Actions (NBA) recommendations and evidence for a customer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Code' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'getCustomerOpportunityRadar',
    description: 'Retrieve high-value opportunity radar expansion signals for a customer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Code' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'getMyPriorityActions',
    description: 'Retrieve the logged-in Relationship Manager’s Daily Relationship Brief and highest priority actions.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'getMyTasks',
    description: 'Retrieve tasks assigned to the current banking officer or due today.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, description: 'Optional status filter: PENDING, IN_PROGRESS, COMPLETED' },
      },
    },
  },
  {
    name: 'getMyOpportunities',
    description: 'Retrieve active pipeline opportunities for the officer portfolio.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        stage: { type: Type.STRING, description: 'Optional stage filter: PROSPECT, QUALIFIED, PROPOSAL, NEGOTIATION' },
      },
    },
  },
  {
    name: 'getMyServiceCases',
    description: 'Retrieve service cases requiring attention or with impending SLA deadlines.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, description: 'Optional status: OPEN, IN_PROGRESS, ESCALATED' },
        priority: { type: Type.STRING, description: 'Optional priority: HIGH, CRITICAL, MEDIUM' },
      },
    },
  },
  {
    name: 'proposeCreateTask',
    description: 'Propose creating a new officer task or follow-up. REQUIRES explicit user confirmation before creation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Code' },
        title: { type: Type.STRING, description: 'Task title (e.g. Schedule relationship review)' },
        dueDate: { type: Type.STRING, description: 'Due date in YYYY-MM-DD format' },
        priority: { type: Type.STRING, description: 'Priority: LOW, MEDIUM, HIGH, CRITICAL' },
        description: { type: Type.STRING, description: 'Detailed action notes' },
      },
      required: ['customerId', 'title', 'dueDate'],
    },
  },
  {
    name: 'proposeCreateFollowup',
    description: 'Propose scheduling a relationship follow-up. REQUIRES explicit user confirmation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Code' },
        title: { type: Type.STRING, description: 'Follow-up title' },
        dueDate: { type: Type.STRING, description: 'Due date (YYYY-MM-DD)' },
        notes: { type: Type.STRING, description: 'Optional notes' },
      },
      required: ['customerId', 'title', 'dueDate'],
    },
  },
  {
    name: 'proposeCreateOpportunity',
    description: 'Propose creating a new sales/lending opportunity. REQUIRES explicit user confirmation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Code' },
        title: { type: Type.STRING, description: 'Opportunity title' },
        expectedValue: { type: Type.STRING, description: 'Estimated value in INR (e.g. 1500000)' },
        stage: { type: Type.STRING, description: 'Stage: PROSPECT, QUALIFIED, PROPOSAL' },
        probability: { type: Type.INTEGER, description: 'Win probability percentage (0-100)' },
      },
      required: ['customerId', 'title', 'expectedValue'],
    },
  },
  {
    name: 'proposeUpdateCase',
    description: 'Propose updating a service case status or resolution. REQUIRES explicit user confirmation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        caseId: { type: Type.INTEGER, description: 'Service Case ID' },
        status: { type: Type.STRING, description: 'New status: IN_PROGRESS, RESOLVED, CLOSED, ESCALATED' },
        priority: { type: Type.STRING, description: 'Priority: LOW, MEDIUM, HIGH, CRITICAL' },
        resolutionSummary: { type: Type.STRING, description: 'Summary of action taken' },
      },
      required: ['caseId'],
    },
  },
  {
    name: 'getMyNotifications',
    description: 'Retrieve active or unread alerts and notifications for the current banking officer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, description: 'Optional status filter: UNREAD, READ, ACKNOWLEDGED, ALL' },
        category: { type: Type.STRING, description: 'Optional category: SERVICE, TASK, OPPORTUNITY, RELATIONSHIP, CUSTOMER, OPERATIONAL' },
        severity: { type: Type.STRING, description: 'Optional severity: CRITICAL, WARNING, INFO, SUCCESS' },
        limit: { type: Type.INTEGER, description: 'Max items to return (default 10)' },
      },
    },
  },
  {
    name: 'getNotificationSummary',
    description: 'Retrieve statistical summary of notifications (total, unread, critical, warning, breakdown by category).',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'explainNotification',
    description: 'Explain the root cause, background context, and recommended operational next steps for a specific notification alert.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        notificationId: { type: Type.INTEGER, description: 'The unique ID of the notification' },
      },
      required: ['notificationId'],
    },
  },
  {
    name: 'proposeAcknowledgeNotification',
    description: 'Propose acknowledging an alert (e.g. Critical SLA breach, score drop, or task overdue). REQUIRES explicit user confirmation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        notificationId: { type: Type.INTEGER, description: 'The notification ID to acknowledge' },
        notes: { type: Type.STRING, description: 'Optional acknowledgment note' },
      },
      required: ['notificationId'],
    },
  },
  {
    name: 'proposeDismissNotification',
    description: 'Propose dismissing an alert. REQUIRES explicit user confirmation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        notificationId: { type: Type.INTEGER, description: 'The notification ID to dismiss' },
        reason: { type: Type.STRING, description: 'Optional dismissal reason' },
      },
      required: ['notificationId'],
    },
  },
  {
    name: 'getAnalyticsOverview',
    description: 'Retrieve executive banking KPIs (customers, relationship value, average CORE score, pipeline value, open service cases, SLA at risk, overdue tasks, and comparisons).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        period: { type: Type.STRING, description: 'Period: today, last_7_days, last_30_days, last_90_days, this_quarter, previous_quarter' },
      },
    },
  },
  {
    name: 'getPortfolioAnalytics',
    description: 'Retrieve banking relationship portfolio analytics (totals, averages, medians, segment/branch/RM/score band breakdowns).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        period: { type: Type.STRING, description: 'Reporting period' },
        branch: { type: Type.STRING, description: 'Branch code (e.g. 0104)' },
        segment: { type: Type.STRING, description: 'Segment/entityType (e.g. INDIVIDUAL, PRIVATE_LIMITED)' },
      },
    },
  },
  {
    name: 'getCustomerHealthAnalytics',
    description: 'Retrieve customer health metrics, score distribution, and list of relationships needing attention or at risk.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        scoreBand: { type: Type.STRING, description: 'Optional score band: 90-100, 75-89, 60-74, 40-59, 0-39' },
      },
    },
  },
  {
    name: 'getOpportunityAnalytics',
    description: 'Retrieve opportunity pipeline metrics, funnel stages, weighted values, and velocity stats.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        oppStage: { type: Type.STRING, description: 'Stage filter: IDENTIFIED, QUALIFIED, PROPOSAL, NEGOTIATION, WON, LOST' },
      },
    },
  },
  {
    name: 'getServicePerformanceAnalytics',
    description: 'Retrieve service desk performance metrics, resolution times, SLA compliance %, at-risk and breached tickets.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        caseStatus: { type: Type.STRING, description: 'Status: OPEN, IN_PROGRESS, RESOLVED, CLOSED, ESCALATED' },
      },
    },
  },
  {
    name: 'getProductPenetrationAnalytics',
    description: 'Retrieve product catalog penetration, relationship depth (0, 1, 2, 3, 4+ products), and value held.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'getWhatChanged',
    description: 'Retrieve the "What Changed?" comparison between the current operating period and prior period across CORE Score, Pipeline, Cases, and Tasks.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        period: { type: Type.STRING, description: 'Period to compare: today, last_7_days, last_30_days, last_90_days, this_quarter' },
      },
    },
  },
  {
    name: 'searchDocuments',
    description: 'Search customer documents in the bank vault by customer name/code, document type, status (VERIFIED, UNDER_REVIEW, REJECTED, REPLACEMENT_REQUIRED, EXPIRED), or query.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.INTEGER, description: 'Customer ID filter' },
        search: { type: Type.STRING, description: 'Keyword, document code (e.g. DOC-2026-004821), or customer name' },
        documentType: { type: Type.STRING, description: 'Document type (e.g. PAN, Salary Slip, Passport, Utility Bill, Bank Statement, Loan Agreement)' },
        status: { type: Type.STRING, description: 'Document status (VERIFIED, UNDER_REVIEW, REJECTED, REPLACEMENT_REQUIRED, EXPIRED)' },
        reviewStatus: { type: Type.STRING, description: 'Review status (PENDING, APPROVED, REJECTED, REPLACEMENT_REQUESTED)' },
        limit: { type: Type.INTEGER, description: 'Max items to return (default 5)' },
      },
    },
  },
  {
    name: 'getDocumentDetails',
    description: 'Retrieve complete details for a banking document by document reference code or ID, including version history, status, and verification reviews.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        documentCode: { type: Type.STRING, description: 'Document reference code (e.g. DOC-2026-004821)' },
        documentId: { type: Type.INTEGER, description: 'Document numerical ID' },
      },
    },
  },
  {
    name: 'getCustomerDocumentRequirements',
    description: 'Check required KYC, address, business, or financial documents for a customer, identifying missing, expired, or replacement-required documents.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.INTEGER, description: 'Customer numerical ID' },
        customerCode: { type: Type.STRING, description: 'Customer reference code (e.g. CUS-10482)' },
      },
      required: [],
    },
  },
  {
    name: 'reviewDocumentAction',
    description: 'Propose a document review action (VERIFY, REJECT, or REQUEST_REPLACEMENT) as a staged Copilot action requiring explicit officer confirmation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        documentId: { type: Type.INTEGER, description: 'Document numerical ID to review' },
        decision: { type: Type.STRING, description: 'Review decision: VERIFY, REJECT, or REQUEST_REPLACEMENT' },
        reason: { type: Type.STRING, description: 'Comments or required rejection/replacement reason' },
        requestedDocType: { type: Type.STRING, description: 'Document type needed if requesting replacement' },
        dueDate: { type: Type.STRING, description: 'Due date for replacement (YYYY-MM-DD)' },
      },
      required: ['documentId', 'decision'],
    },
  },
  {
    name: 'getRelationshipTwin',
    description: 'Retrieve the comprehensive Relationship Digital Twin for a customer, including unified relationship state (STABLE, ATTENTION_REQUIRED, GROWING, etc.), "Why This State?", "What Changed?", health metrics, active signals, and timeline.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Customer Code (e.g. 1 or CUS-10482)' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'getBeforeYouActAdvisory',
    description: 'Retrieve the contextual "Before You Act" advisory for a customer, highlighting unresolved service grievances, pending SLA risks, document replacement deadlines, and recommended officer precautions before transacting or pitching.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Customer Code (e.g. 1 or CUS-10482)' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'getRelationshipGraph',
    description: 'Retrieve the governed Relationship Graph for a customer or banking entity with connected accounts, loans, products, opportunities, service cases, interactions, and tasks.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        entityType: { type: Type.STRING, description: 'Root entity type: CUSTOMER, ACCOUNT, LOAN, OPPORTUNITY, or SERVICE_CASE (default: CUSTOMER)' },
        entityId: { type: Type.STRING, description: 'Entity ID or Code (e.g. CUS-10482 or 1)' },
        depth: { type: Type.INTEGER, description: 'Traversal depth: 1 (direct neighbors), 2 (extended relationships), or 3 (max)' },
      },
      required: ['entityId'],
    },
  },
  {
    name: 'getRelationshipNeighbors',
    description: 'Retrieve immediate degree-1 banking relationship neighbors for a customer or banking entity.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        entityType: { type: Type.STRING, description: 'Entity type (CUSTOMER, ACCOUNT, LOAN, OPPORTUNITY, SERVICE_CASE)' },
        entityId: { type: Type.STRING, description: 'Entity ID or Code' },
      },
      required: ['entityId'],
    },
  },
  {
    name: 'getRelationshipPath',
    description: 'Find the shortest authorized connectivity path between two banking entities (e.g. Customer to Account to Product).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        sourceType: { type: Type.STRING, description: 'Source entity type (e.g. CUSTOMER)' },
        sourceId: { type: Type.STRING, description: 'Source entity ID or code' },
        targetType: { type: Type.STRING, description: 'Target entity type (e.g. PRODUCT or OPPORTUNITY)' },
        targetId: { type: Type.STRING, description: 'Target entity ID or code' },
      },
      required: ['sourceType', 'sourceId', 'targetType', 'targetId'],
    },
  },
  {
    name: 'getRelationshipEvidence',
    description: 'Retrieve detailed provenance and regulatory audit evidence explaining why a specific relationship connection exists in the graph.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        edgeId: { type: Type.STRING, description: 'Unique edge ID from relationship graph' },
      },
      required: ['edgeId'],
    },
  },
  {
    name: 'getDecisionTrace',
    description: 'Retrieve explainable Decision Trace for an AI recommendation, CORE score change, alert, or NBA. Explains why a decision was reached, confidence, evidence, and limitations.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        decisionId: { type: Type.STRING, description: 'Decision Trace ID (e.g. DT-20260928-00101) or database ID' },
      },
      required: ['decisionId'],
    },
  },
  {
    name: 'getDecisionEvidence',
    description: 'Retrieve granular contributing evidence items (facts, metrics, events, signals) supporting a decision trace.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        decisionId: { type: Type.STRING, description: 'Decision Trace ID' },
      },
      required: ['decisionId'],
    },
  },
  {
    name: 'getDecisionSources',
    description: 'Retrieve source system chain and data freshness timestamps for a decision trace.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        decisionId: { type: Type.STRING, description: 'Decision Trace ID' },
      },
      required: ['decisionId'],
    },
  },
  {
    name: 'getDecisionHistory',
    description: 'Retrieve chronological decision traces and previous recommendations for a customer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or CIF number' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'createStrategyScenario',
    description: 'Create a non-destructive what-if strategy scenario for a customer. Does NOT mutate customer records.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.INTEGER, description: 'Customer database ID' },
        name: { type: Type.STRING, description: 'Name of the scenario (e.g. Service Recovery Plan)' },
        description: { type: Type.STRING, description: 'Scenario objective description' },
        actions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              actionType: { type: Type.STRING, description: 'Supported action type (SCHEDULE_RELATIONSHIP_REVIEW, RESOLVE_SERVICE_CASE, FOLLOW_UP_OPPORTUNITY, COMPLETE_TASK, COMPLETE_COMMITMENT, LOG_RELATIONSHIP_INTERACTION, INCREASE_ENGAGEMENT_ACTIVITY, ACTIVATE_EXISTING_PRODUCT_OPPORTUNITY)' },
              targetEntityType: { type: Type.STRING },
              targetEntityId: { type: Type.STRING },
              orderIndex: { type: Type.INTEGER },
            },
            required: ['actionType'],
          },
          description: 'List of what-if actions to simulate',
        },
      },
      required: ['customerId', 'name'],
    },
  },
  {
    name: 'simulateStrategyScenario',
    description: 'Run deterministic what-if simulation on customer relationship. Returns before/after metrics and explanations without writing to production tables.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.INTEGER, description: 'Customer database ID' },
        scenarioId: { type: Type.STRING, description: 'Existing scenario ID or code (optional)' },
        actions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              actionType: { type: Type.STRING },
              targetEntityType: { type: Type.STRING },
              targetEntityId: { type: Type.STRING },
              orderIndex: { type: Type.INTEGER },
            },
            required: ['actionType'],
          },
          description: 'Actions to simulate if running ad-hoc without existing scenario ID',
        },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'getStrategyScenario',
    description: 'Retrieve a saved what-if scenario including base snapshot, actions, and simulated outcomes.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        scenarioId: { type: Type.STRING, description: 'Scenario ID or code (e.g. STR-20260928-001)' },
      },
      required: ['scenarioId'],
    },
  },
  {
    name: 'compareStrategyScenario',
    description: 'Compare two what-if strategy scenarios side-by-side for the same customer to analyze metric advantages.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        baseScenarioId: { type: Type.STRING, description: 'Base scenario ID or code' },
        targetScenarioId: { type: Type.STRING, description: 'Target scenario ID or code' },
      },
      required: ['baseScenarioId', 'targetScenarioId'],
    },
  },
  {
    name: 'getScenarioTrace',
    description: 'Retrieve explainable Decision Trace for a strategy simulation scenario.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        scenarioId: { type: Type.STRING, description: 'Scenario ID or code' },
      },
      required: ['scenarioId'],
    },
  },
  // Phase 31: Governed Agent Tools
  {
    name: 'createAgentPlan',
    description: 'Draft a governed multi-step banking agent execution plan with objective, steps, and rationale.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.INTEGER, description: 'Customer DB ID' },
        title: { type: Type.STRING, description: 'Plan title (e.g. Relationship Recovery Plan)' },
        objective: { type: Type.STRING, description: 'Business objective for the agent plan' },
        steps: {
          type: Type.ARRAY,
          description: 'Ordered sequence of governed banking steps',
          items: {
            type: Type.OBJECT,
            properties: {
              actionType: { type: Type.STRING, description: 'Allowlisted action type (e.g. CREATE_TASK, UPDATE_SERVICE_CASE)' },
              targetEntityType: { type: Type.STRING, description: 'Target entity type' },
              targetEntityId: { type: Type.STRING, description: 'Target entity ID' },
              rationale: { type: Type.STRING, description: 'Business justification for step' },
              parameters: { type: Type.OBJECT, description: 'Structured step parameters' },
            },
          },
        },
      },
      required: ['customerId', 'title', 'objective', 'steps'],
    },
  },
  {
    name: 'validateAgentPlan',
    description: 'Pre-validate an agent plan against dependency rules, allowlisted actions, and RBAC permissions.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        planId: { type: Type.STRING, description: 'Plan code or ID' },
      },
      required: ['planId'],
    },
  },
  {
    name: 'getAgentPlan',
    description: 'Retrieve an agent plan, its current approval state, and sequential step details.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        planId: { type: Type.STRING, description: 'Plan code or ID (e.g. PLN-...)' },
      },
      required: ['planId'],
    },
  },
  {
    name: 'approveAgentPlan',
    description: 'Approve an agent plan for governed execution (or provide specific step numbers for partial approval).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        planId: { type: Type.STRING, description: 'Plan code or ID' },
        approvedStepNumbers: { type: Type.ARRAY, items: { type: Type.INTEGER }, description: 'Optional subset of step numbers to approve' },
      },
      required: ['planId'],
    },
  },
  {
    name: 'rejectAgentPlan',
    description: 'Reject and cancel a drafted agent plan.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        planId: { type: Type.STRING, description: 'Plan code or ID' },
        reason: { type: Type.STRING, description: 'Rejection rationale' },
      },
      required: ['planId'],
    },
  },
  {
    name: 'executeAgentPlan',
    description: 'Trigger governed backend sequential execution of an approved agent plan.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        planId: { type: Type.STRING, description: 'Plan code or ID to execute' },
      },
      required: ['planId'],
    },
  },
  {
    name: 'getAgentExecution',
    description: 'Retrieve execution progress, step outcomes, and verification details of an agent plan.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        planId: { type: Type.STRING, description: 'Plan code or ID' },
      },
      required: ['planId'],
    },
  },
  {
    name: 'getAgentAudit',
    description: 'Retrieve immutable audit log references and execution trace for a governed agent plan.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        planId: { type: Type.STRING, description: 'Plan code or ID' },
      },
      required: ['planId'],
    },
  },
  // Phase 32: Relationship Value & Portfolio Scenario Intelligence Tools
  {
    name: 'getRelationshipValueProfile',
    description: 'Retrieve multidimensional relationship value profile across 10 measurable dimensions including CORE score, products, engagement, and service health.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Code (e.g. 1 or CUS-10482)' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'getRelationshipValueHistory',
    description: 'Retrieve 30/60/90-day historical relationship profile trend timeline.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Code' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'compareRelationshipValueScenario',
    description: 'Compare current relationship value profile against a simulated strategy scenario across all 10 relationship dimensions.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Code' },
        scenarioId: { type: Type.STRING, description: 'Strategy scenario code (e.g. STR-20260928-001)' },
      },
      required: ['customerId', 'scenarioId'],
    },
  },
  {
    name: 'explainRelationshipValueChange',
    description: 'Provide an explainable breakdown of why a relationship profile changes under a scenario, distinguishing FACT, SCENARIO, INTERPRETATION, and LIMITATION.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Code' },
        scenarioId: { type: Type.STRING, description: 'Strategy scenario code' },
      },
      required: ['customerId', 'scenarioId'],
    },
  },
  {
    name: 'getCustomerJourneys',
    description: 'Retrieve active and historical customer lifecycle journeys with SLA status, progress, blockers, and assigned owners.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Customer Code (e.g. CUS-10482 or 1)' },
        status: { type: Type.STRING, description: 'Optional journey status filter (NOT_STARTED, IN_PROGRESS, BLOCKED, COMPLETED, CANCELLED, ESCALATED)' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'getJourney',
    description: 'Retrieve detailed customer lifecycle journey state including metadata, SLA, priority, owner, step count, and blocker status.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        journeyId: { type: Type.STRING, description: 'Journey ID or Journey Code (e.g. CJ-2026-0001 or 1)' },
        customerId: { type: Type.STRING, description: 'Customer ID or Code for resource scoping' },
      },
      required: ['journeyId'],
    },
  },
  {
    name: 'getJourneyTimeline',
    description: 'Retrieve chronological audit timeline of lifecycle events, transitions, handoffs, and escalations for a journey.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        journeyId: { type: Type.STRING, description: 'Journey ID or Journey Code' },
        customerId: { type: Type.STRING, description: 'Customer ID or Code for resource scoping' },
      },
      required: ['journeyId'],
    },
  },
  {
    name: 'getJourneySteps',
    description: 'Retrieve complete step matrix for a journey with dependencies, SLA status, assigned owners, and blocker details.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        journeyId: { type: Type.STRING, description: 'Journey ID or Journey Code' },
        customerId: { type: Type.STRING, description: 'Customer ID or Code for resource scoping' },
      },
      required: ['journeyId'],
    },
  },
  {
    name: 'getJourneyBlockers',
    description: 'Retrieve currently blocked steps, prerequisite failures, and SLA breaches across customer journeys.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Customer Code' },
        journeyId: { type: Type.STRING, description: 'Optional specific journey ID' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'getJourneyEvidence',
    description: 'Retrieve verified authoritative evidence records (KYC, documents, service cases, tasks, approvals) for journey steps.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        journeyId: { type: Type.STRING, description: 'Journey ID or Journey Code' },
        stepId: { type: Type.STRING, description: 'Optional specific step ID or Step Key' },
        customerId: { type: Type.STRING, description: 'Customer ID or Code for resource scoping' },
      },
      required: ['journeyId'],
    },
  },
  {
    name: 'getJourneyHistory',
    description: 'Retrieve historical completed and cancelled customer journeys with recorded outcomes and metrics.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID or Customer Code' },
        limit: { type: Type.INTEGER, description: 'Max number of historical journeys to return (default 10)' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'getRelationshipGroups',
    description: 'Retrieve authorized relationship groups (households, business groups) matching filters.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        search: { type: Type.STRING, description: 'Optional search keyword (e.g. Sharma or HH-10482)' },
        groupType: { type: Type.STRING, description: 'Optional group type: HOUSEHOLD, BUSINESS, BUSINESS_GROUP' },
        limit: { type: Type.INTEGER, description: 'Max groups to return (default 10)' },
      },
    },
  },
  {
    name: 'getRelationshipGroup',
    description: 'Retrieve detailed relationship group entity by group ID or code (e.g. HH-10482 or BIZ-10482).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        groupId: { type: Type.STRING, description: 'Group ID or Code (e.g. HH-10482)' },
      },
      required: ['groupId'],
    },
  },
  {
    name: 'getGroupMembers',
    description: 'Retrieve members of a relationship group with member-level RBAC privacy protection.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        groupId: { type: Type.STRING, description: 'Group ID or Code (e.g. HH-10482)' },
      },
      required: ['groupId'],
    },
  },
  {
    name: 'getGroupProfile',
    description: 'Retrieve multidimensional group profile including relationship value, CORE profile range, products, service health, and opportunities.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        groupId: { type: Type.STRING, description: 'Group ID or Code (e.g. HH-10482)' },
      },
      required: ['groupId'],
    },
  },
  {
    name: 'getGroupTimeline',
    description: 'Retrieve chronological interaction timeline across all entities in the group.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        groupId: { type: Type.STRING, description: 'Group ID or Code' },
        limit: { type: Type.INTEGER, description: 'Max events to return (default 20)' },
      },
      required: ['groupId'],
    },
  },
  {
    name: 'getGroupSignals',
    description: 'Retrieve active signals, risks, and alerts across group members from Signal Center.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        groupId: { type: Type.STRING, description: 'Group ID or Code' },
      },
      required: ['groupId'],
    },
  },
  {
    name: 'getGroupJourneys',
    description: 'Retrieve lifecycle journeys active or blocked across group members.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        groupId: { type: Type.STRING, description: 'Group ID or Code' },
      },
      required: ['groupId'],
    },
  },
  {
    name: 'getGroupOpportunities',
    description: 'Retrieve CRM business opportunities across authorized group members.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        groupId: { type: Type.STRING, description: 'Group ID or Code' },
      },
      required: ['groupId'],
    },
  },
  {
    name: 'getGroupServiceCases',
    description: 'Retrieve service desk tickets, SLAs, and open issues across group members.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        groupId: { type: Type.STRING, description: 'Group ID or Code' },
      },
      required: ['groupId'],
    },
  },
  {
    name: 'getGroupEvidence',
    description: 'Retrieve verified graph edges, KYC provenance, and audit evidence for group relationships.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        groupId: { type: Type.STRING, description: 'Group ID or Code' },
      },
      required: ['groupId'],
    },
  },
  // ==========================================
  // PHASE 35: TRUST & GOVERNANCE TOOLS
  // ==========================================
  {
    name: 'getGovernanceOverview',
    description: 'Retrieve enterprise governance overview, status, AI metrics, audit metrics, security events, and active exceptions.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'getAuditEvents',
    description: 'Search and inspect tamper-evident audit logs with actor, module, event, outcome, and cryptographic chain status.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        event: { type: Type.STRING, description: 'Action or event type (e.g. AGENT_STEP_COMPLETED, PERMISSION_DENIED)' },
        module: { type: Type.STRING, description: 'Target module (e.g. AGENT_PLAN, CUSTOMER_360, GROUP)' },
        limit: { type: Type.INTEGER, description: 'Maximum number of records to return' },
      },
    },
  },
  {
    name: 'getAIGovernance',
    description: 'Inspect AI governance metrics, model configuration status (without secrets), tool execution counts, and fallback events.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'getAgentGovernance',
    description: 'Inspect Controlled Banking Agent activity, plan approvals, executions, partial completions, and failures.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'getSecurityEvents',
    description: 'Inspect security metrics, failed logins, authorization failures, expired sessions, and rate-limit events.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'getAccessEvents',
    description: 'Inspect data and resource access governance, customer context requests, and group access.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'getGovernanceExceptions',
    description: 'Retrieve open, under review, and resolved governance exceptions across AI, Agent, Security, and Operational domains.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, description: 'Status filter: OPEN, UNDER_REVIEW, RESOLVED, DISMISSED' },
        severity: { type: Type.STRING, description: 'Severity filter: INFO, LOW, MEDIUM, HIGH, CRITICAL' },
      },
    },
  },
  {
    name: 'getSystemHealth',
    description: 'Retrieve live health status of API Gateway, PostgreSQL Database, Auth Engine, Gemini configuration, and Notification service.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  // ==========================================
  // PHASE 36: BANKING OPERATIONS WORKSPACE TOOLS
  // ==========================================
  {
    name: 'getMyOperationalApprovals',
    description: 'Retrieve pending maker/checker operational approval requests awaiting authorization.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, description: 'Approval status: PENDING, UNDER_REVIEW, APPROVED, REJECTED, RETURNED' },
        priority: { type: Type.STRING, description: 'Priority: LOW, MEDIUM, HIGH, CRITICAL' },
      },
    },
  },
  {
    name: 'getOperationalExceptions',
    description: 'List operational exceptions across TRANSACTION, KYC, DOCUMENT, SLA, RECONCILIATION, and WORKFLOW domains.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING, description: 'Category: TRANSACTION, KYC, DOCUMENT, SLA, RECONCILIATION, WORKFLOW, SERVICE, ACCOUNT, LOAN' },
        severity: { type: Type.STRING, description: 'Severity: INFO, LOW, MEDIUM, HIGH, CRITICAL' },
        status: { type: Type.STRING, description: 'Status: OPEN, ACKNOWLEDGED, IN_PROGRESS, RESOLVED' },
      },
    },
  },
  {
    name: 'getOperationalException',
    description: 'Retrieve detailed information, evidence, and resolution timeline for a specific operational exception ID.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        exceptionId: { type: Type.STRING, description: 'Exception ID (e.g. OEX-2026-10482-01)' },
      },
      required: ['exceptionId'],
    },
  },
  {
    name: 'getReconciliationRecords',
    description: 'Inspect synthetic reconciliation records with expected, observed, and variance amounts.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, description: 'Status: MATCHED, MISMATCH, INVESTIGATING, ADJUSTMENT_PENDING, RESOLVED' },
        reconciliationType: { type: Type.STRING, description: 'Type of reconciliation' },
      },
    },
  },
  {
    name: 'getOperationalTasks',
    description: 'Retrieve pending operational tasks requiring branch operations attention.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'getOperationalEvents',
    description: 'Inspect chronological stream of banking operations events and system alerts.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        severity: { type: Type.STRING, description: 'Severity: INFO, LOW, MEDIUM, HIGH, CRITICAL' },
        limit: { type: Type.INTEGER, description: 'Max events to return' },
      },
    },
  },
  // ==========================================
  // PHASE 37: ADVANCED PORTFOLIO INTELLIGENCE
  // ==========================================
  {
    name: 'getPortfolioOverview',
    description: 'Retrieve authorized relationship portfolio overview KPIs including total relationship value, customer count, average CORE score, pipeline value, open service cases, and signals.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        segment: { type: Type.STRING, description: 'Optional customer segment filter' },
        entityType: { type: Type.STRING, description: 'Optional entity type filter (INDIVIDUAL, CORPORATE, etc.)' },
      },
    },
  },
  {
    name: 'getPortfolioHealth',
    description: 'Retrieve authorized customer distribution across relationship health categories (HEALTHY, STABLE, WATCH, AT_RISK, CRITICAL).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        segment: { type: Type.STRING, description: 'Optional customer segment filter' },
      },
    },
  },
  {
    name: 'getPortfolioCoreScoreDistribution',
    description: 'Analyze authorized portfolio CORE score distribution, average, range, components breakdown, and significant score movements.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        segment: { type: Type.STRING, description: 'Optional customer segment filter' },
      },
    },
  },
  {
    name: 'getPortfolioRelationshipValue',
    description: 'Analyze total relationship value, concentration by top customers, and entity type distribution across authorized portfolio.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'getPortfolioProductPenetration',
    description: 'Examine product adoption rates, product depth distribution, and multi-product relationships across authorized customers.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'getPortfolioEngagement',
    description: 'Review interaction volume, recency distribution, channels breakdown, and inactive customers (>45 days without interaction).',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'getPortfolioServiceHealth',
    description: 'Examine open customer service cases, SLA breach counts, SLA risk status, and case category distribution.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'getPortfolioPipeline',
    description: 'Retrieve opportunity pipeline metrics, stages breakdown, weighted pipeline values, and stalled opportunities.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'getPortfolioSignals',
    description: 'Inspect active operational and relationship signals across authorized customers by severity and type.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'getPortfolioActions',
    description: 'Retrieve Next Best Action (NBA) availability, categories, and action outcome trace metrics (proposed, executed, outcome).',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'getPortfolioChanges',
    description: 'Inspect "What Changed" portfolio telemetry and chronological events across the relationship portfolio.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'getIntegrations',
    description: 'List enterprise integrations, simulator adapters, statuses, and domains in the API gateway.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        domain: { type: Type.STRING, description: 'Optional domain filter (CORE_BANKING, KYC, PAYMENTS, etc.)' },
        status: { type: Type.STRING, description: 'Optional status filter (SIMULATED, AVAILABLE, etc.)' },
      },
    },
  },
  {
    name: 'getIntegration',
    description: 'Retrieve technical metadata, environment, adapter type, and version for an integration.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        integrationId: { type: Type.STRING, description: 'Integration ID (e.g. INT-COREBANKING, INT-KYC)' },
      },
      required: ['integrationId'],
    },
  },
  {
    name: 'getIntegrationHealth',
    description: 'Inspect live health status, circuit breaker state, latency, and diagnostics for an integration.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        integrationId: { type: Type.STRING, description: 'Integration ID to inspect health for' },
      },
      required: ['integrationId'],
    },
  },
  {
    name: 'getIntegrationEvents',
    description: 'Query integration event logs with correlation ID, direction, and latency metrics.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        integrationId: { type: Type.STRING, description: 'Optional integration ID filter' },
        status: { type: Type.STRING, description: 'Optional status filter (SUCCESS, FAILED, TIMEOUT)' },
        limit: { type: Type.INTEGER, description: 'Max events to return (default 20)' },
      },
    },
  },
  {
    name: 'getIntegrationFailures',
    description: 'List recent integration outages, timeout failures, and retryable errors.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'getWebhookDeliveries',
    description: 'Query webhook delivery attempts, retry status, latency, and HTTP response codes.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        webhookId: { type: Type.STRING, description: 'Optional webhook ID filter' },
        status: { type: Type.STRING, description: 'Optional status filter (DELIVERED, RETRYING, EXHAUSTED)' },
      },
    },
  },
];

export async function executeCopilotTool(
  toolName: string,
  args: Record<string, any>,
  ctx: ToolExecutionContext
): Promise<ToolResult> {
  const sources: CopilotSource[] = [];
  // 0. Re-authorize tool execution against server-side RBAC and resource ownership
  await copilotSecurity.authorizeToolExecution(
    toolName,
    args,
    ctx.user as any,
    ctx.requestId
  );

  // 1. Audit tool invocation
  await auditRepository.createLog({
    actorId: String(ctx.user.id),
    actorName: ctx.user.name,
    action: 'COPILOT_TOOL_USED',
    resourceType: 'COPILOT_TOOL',
    resourceId: toolName,
    requestId: ctx.requestId,
    outcome: 'SUCCESS',
    metadata: {
      toolName,
      args,
    },
  });

  switch (toolName) {
    case 'searchCustomer': {
      const q = String(args.query || '').trim();
      const limit = Number(args.limit) || 5;
      const results = await customerService.listCustomers({ search: q, limit });
      return {
        data: results.data.map((c) => ({
          id: c.id,
          customerCode: c.customerCode,
          cifNumber: c.cifNumber,
          name: c.name,
          entityType: c.entityType,
          riskCategory: c.riskCategory,
        })),
        sources: results.data.slice(0, 3).map((c) => ({
          type: 'CUSTOMER',
          id: c.customerCode,
          label: `${c.name} (${c.customerCode})`,
          link: '/customers',
        })),
      };
    }

    case 'getCustomer360': {
      const custId = args.customerId;
      const bundle = await customerService.getCustomer360(custId, {
        actorId: String(ctx.user.id),
        actorName: ctx.user.name,
        requestId: ctx.requestId,
      });

      const c = bundle.customer;
      sources.push({
        type: 'CUSTOMER',
        id: c.customerCode,
        label: `Customer 360 · ${c.name} (${c.customerCode})`,
        link: '/customers',
      });

      if (bundle.score) {
        sources.push({
          type: 'CORE_SCORE',
          id: String(bundle.score.coreScore),
          label: `CORE Score: ${bundle.score.coreScore}`,
          link: '/customers',
        });
      }

      return {
        data: {
          customer: {
            id: c.id,
            customerCode: c.customerCode,
            cifNumber: c.cifNumber,
            name: c.name,
            entityType: c.entityType,
            relationshipValue: c.relationshipValue,
            riskCategory: c.riskCategory,
            cibilScore: c.cibilScore,
            status: c.status,
            onboardingDate: c.onboardingDate,
          },
          financialSummary: {
            totalAccounts: bundle.accounts.length,
            totalLoans: bundle.loans.length,
            totalProducts: bundle.products.length,
            totalOpportunities: bundle.opportunities.length,
            openCasesCount: bundle.cases.filter((cs) => cs.status !== 'RESOLVED' && cs.status !== 'CLOSED').length,
          },
          score: bundle.score
            ? {
                coreScore: bundle.score.coreScore,
                financialHealthScore: bundle.score.financialHealthScore,
                creditRiskScore: bundle.score.creditRiskScore,
                engagementScore: bundle.score.engagementScore,
                churnProbability: bundle.score.churnProbability,
              }
            : null,
          activeOpportunitiesCount: bundle.opportunities.length,
        },
        sources,
      };
    }

    case 'getCustomerAccounts': {
      const custId = args.customerId;
      const accounts = await customerService.getCustomerAccounts(custId);
      sources.push({
        type: 'ACCOUNT',
        id: String(custId),
        label: `Accounts Registry (${accounts.length} accounts)`,
        link: '/accounts',
      });
      return {
        data: accounts.map((a) => ({
          accountNumber: a.accountNumber,
          accountType: a.accountType,
          schemeName: a.schemeName,
          availableBalance: a.balance?.availableBalance || '0.00',
          status: a.status,
        })),
        sources,
      };
    }

    case 'getCustomerLoans': {
      const custId = args.customerId;
      const loans = await customerService.getCustomerLoans(custId);
      return {
        data: loans.map((l) => ({
          loanAccountNumber: l.loanAccountNumber,
          loanType: l.loanType,
          sanctionedAmount: l.sanctionedLimit,
          outstandingBalance: l.outstandingPrincipal,
          interestRate: l.interestRate,
          status: l.assetClassification,
        })),
        sources: [
          {
            type: 'CUSTOMER',
            id: String(custId),
            label: `Lending Portfolio (${loans.length} facilities)`,
            link: '/loans',
          },
        ],
      };
    }

    case 'getCustomerProducts': {
      const custId = args.customerId;
      const customer = await customerService.getCustomerById(custId);
      const summary = await financialRelationshipService.getCustomerFinancialSummary(customer.id);
      return {
        data: {
          totalProductsCount: summary.activeProducts.length,
          products: summary.activeProducts.map((p) => ({
            name: p.productName,
            code: p.productCode,
            category: p.category,
            status: p.status,
          })),
          storedRelationshipValue: summary.storedRelationshipValue,
          netFinancialPosition: summary.calculatedMetrics.netFinancialPosition,
        },
        sources: [
          {
            type: 'CUSTOMER',
            id: customer.customerCode,
            label: `Products Holdings (${summary.activeProducts.length})`,
            link: '/products',
          },
        ],
      };
    }

    case 'getCustomerCases': {
      const custId = args.customerId;
      const cases = await customerService.getCustomerCases(custId);
      return {
        data: cases.map((c) => ({
          id: c.id,
          caseNumber: c.caseNumber,
          title: c.title,
          category: c.category,
          priority: c.priority,
          status: c.status,
          slaDueDate: c.slaDueDate,
          resolutionSummary: c.resolutionSummary,
        })),
        sources: cases.slice(0, 3).map((c) => ({
          type: 'CASE',
          id: c.caseNumber,
          label: `Case ${c.caseNumber}: ${c.title}`,
          link: '/service-desk',
        })),
      };
    }

    case 'getCustomerInteractions': {
      const custId = args.customerId;
      const interactions = await customerService.getCustomerInteractions(custId);
      return {
        data: interactions.slice(0, 5).map((i) => ({
          id: i.id,
          channel: i.channel,
          interactionType: i.interactionType,
          subject: i.subject,
          summary: i.summary,
          outcome: i.outcome,
          createdAt: i.createdAt,
        })),
        sources: [
          {
            type: 'INTERACTION',
            id: String(custId),
            label: `Customer Touchpoint Log (${interactions.length})`,
            link: '/customers',
          },
        ],
      };
    }

    case 'getCustomerOpportunities': {
      const custId = args.customerId;
      const opps = await customerService.getCustomerOpportunities(custId);
      return {
        data: opps.map((o) => ({
          id: o.id,
          opportunityCode: o.opportunityCode,
          title: o.title,
          stage: o.stage,
          expectedValue: o.expectedValue,
          probability: o.probability,
          expectedCloseDate: o.expectedCloseDate,
        })),
        sources: opps.slice(0, 3).map((o) => ({
          type: 'OPPORTUNITY',
          id: o.opportunityCode,
          label: `Opportunity: ${o.title} (₹${o.expectedValue})`,
          link: '/opportunities',
        })),
      };
    }

    case 'getCustomerTasks': {
      const custId = args.customerId;
      const customer = await customerService.getCustomerById(custId);
      const tasksList = await taskService.listTasks({ customerId: customer.id });
      return {
        data: tasksList.map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
          priority: t.priority,
          status: t.status,
          relatedType: t.relatedType,
        })),
        sources: tasksList.slice(0, 3).map((t) => ({
          type: 'TASK',
          id: String(t.id),
          label: `Task: ${t.title}`,
          link: '/tasks',
        })),
      };
    }

    case 'getCustomerScore': {
      const custId = args.customerId;
      const score = await customerService.getCustomerScore(custId);
      sources.push({
        type: 'CORE_SCORE',
        id: String(score.coreScore),
        label: `CORE Score: ${score.coreScore} (Financial Health: ${score.financialHealthScore}, Credit Risk: ${score.creditRiskScore})`,
        link: '/customers',
      });
      return {
        data: {
          coreScore: score.coreScore,
          financialHealthScore: score.financialHealthScore,
          creditRiskScore: score.creditRiskScore,
          engagementScore: score.engagementScore,
          churnProbability: score.churnProbability,
          calculationDate: score.calculationDate,
          factors: score.factors ? JSON.parse(score.factors) : null,
        },
        sources,
      };
    }

    case 'getCustomerScoreHistory': {
      const custId = args.customerId;
      const score = await customerService.getCustomerScore(custId);
      return {
        data: {
          currentScore: score.coreScore,
          calculationDate: score.calculationDate,
          trend: 'STABLE_POSITIVE',
          priorBaseline: score.coreScore >= 80 ? score.coreScore - 4 : score.coreScore + 3,
          components: {
            financialHealth: score.financialHealthScore,
            creditRisk: score.creditRiskScore,
            engagement: score.engagementScore,
          },
        },
        sources: [
          {
            type: 'CORE_SCORE',
            id: String(score.coreScore),
            label: `CORE Score Trend & Momentum`,
            link: '/customers',
          },
        ],
      };
    }

    case 'getCustomerInsights': {
      const custId = args.customerId;
      const customer = await customerService.getCustomerById(custId);
      const insights = await relationshipIntelligenceService.evaluateCustomer(customer.id);
      return {
        data: insights.slice(0, 4).map((i) => ({
          id: i.id,
          insightId: i.insightId,
          type: i.insightType,
          category: i.category,
          title: i.title,
          summary: i.summary,
          impact: i.impact,
          priority: i.priority,
          status: i.status,
          recommendedActionType: i.recommendedActionType,
        })),
        sources: insights.slice(0, 3).map((i) => ({
          type: 'INTELLIGENCE',
          id: i.insightId || String(i.id),
          label: `Intelligence: ${i.title}`,
          link: '/intelligence',
        })),
      };
    }

    case 'getCustomerNextBestActions': {
      const custId = args.customerId;
      const customer = await customerService.getCustomerById(custId);
      const actions = await nextBestActionService.evaluateCustomer(customer.id);
      return {
        data: actions.slice(0, 4).map((a) => ({
          id: a.id,
          actionCode: a.actionId,
          title: a.title,
          category: a.category,
          actionType: a.actionType,
          priority: a.priority,
          urgency: a.urgency,
          rationalExplanation: a.rationale,
          expectedImpact: a.expectedImpact,
          recommendedActionPrompt: a.description,
        })),
        sources: actions.slice(0, 2).map((a) => ({
          type: 'NBA',
          id: a.actionId || String(a.id),
          label: `Next Best Action: ${a.title}`,
          link: '/next-best-actions',
        })),
      };
    }

    case 'getCustomerOpportunityRadar': {
      const custId = args.customerId;
      const customer = await customerService.getCustomerById(custId);
      const radar = await opportunityRadarService.evaluateCustomer(customer.id);
      return {
        data: radar.slice(0, 4).map((r) => ({
          signalCode: r.radarId,
          productCategory: r.category,
          headline: r.title,
          confidenceScore: r.confidence,
          opportunityScore: r.relevanceScore,
          estimatedRevenueRange: r.expectedValueBand,
        })),
        sources: radar.slice(0, 2).map((r) => ({
          type: 'RADAR',
          id: r.radarId,
          label: `Radar Signal: ${r.title}`,
          link: '/opportunity-radar',
        })),
      };
    }

    case 'getMyPriorityActions': {
      const brief = await nextBestActionService.getDailyRelationshipBrief(ctx.user.id);
      return {
        data: {
          actNowCount: brief.actNow.length,
          actNow: brief.actNow.slice(0, 3).map((a) => ({
            customerName: a.customerName,
            customerCode: a.customerCode,
            title: a.title,
            priority: a.priority,
            urgency: a.urgency,
            rationale: a.rationale,
          })),
          followUpCount: brief.followUp.length,
          watchCustomersCount: brief.watch.length,
        },
        sources: [
          {
            type: 'NBA',
            id: 'DAILY_BRIEF',
            label: 'RM Daily Relationship Brief',
            link: '/dashboard',
          },
        ],
      };
    }

    case 'getMyTasks': {
      const tasksList = await taskService.listTasks({
        status: args.status,
        limit: 10,
      });
      return {
        data: tasksList.map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
          priority: t.priority,
          status: t.status,
        })),
        sources: [
          {
            type: 'TASK',
            id: 'OFFICER_TASKS',
            label: `Officer Task Queue (${tasksList.length} tasks)`,
            link: '/tasks',
          },
        ],
      };
    }

    case 'getMyOpportunities': {
      const opps = await opportunityService.listOpportunities({
        stage: args.stage,
        limit: 10,
      });
      return {
        data: opps.map((o) => ({
          id: o.id,
          opportunityCode: o.opportunityCode,
          title: o.title,
          stage: o.stage,
          expectedValue: o.expectedValue,
          probability: o.probability,
        })),
        sources: [
          {
            type: 'OPPORTUNITY',
            id: 'OFFICER_PIPELINE',
            label: `Active Pipeline (${opps.length} opportunities)`,
            link: '/opportunities',
          },
        ],
      };
    }

    case 'getMyServiceCases': {
      const cases = await caseService.listCases({
        status: args.status,
        priority: args.priority,
        limit: 10,
      });
      return {
        data: cases.data.map((c) => ({
          id: c.id,
          caseNumber: c.caseNumber,
          title: c.title,
          priority: c.priority,
          status: c.status,
          slaDueDate: c.slaDueDate,
        })),
        sources: [
          {
            type: 'CASE',
            id: 'SERVICE_DESK',
            label: `Service Cases (${cases.data.length})`,
            link: '/service-desk',
          },
        ],
      };
    }

    // ----------------------------------------------------
    // PROPOSAL / MUTATION TOOLS (NEVER AUTO-EXECUTES!)
    // ----------------------------------------------------
    case 'proposeCreateTask': {
      const cust = await customerService.getCustomerById(args.customerId);
      const pendingAction = pendingActionService.createPendingAction({
        userId: ctx.user.id,
        userName: ctx.user.name,
        actionType: 'CREATE_TASK',
        title: `Create Task: ${args.title}`,
        summary: `Assign follow-up for ${cust.name} (${cust.customerCode})`,
        payload: {
          customerId: cust.id,
          title: args.title,
          dueDate: args.dueDate,
          priority: args.priority || 'MEDIUM',
          description: args.description || '',
        },
        customerContext: {
          id: cust.id,
          name: cust.name,
          customerCode: cust.customerCode,
        },
      });

      await auditRepository.createLog({
        actorId: String(ctx.user.id),
        actorName: ctx.user.name,
        action: 'COPILOT_ACTION_PROPOSED',
        resourceType: 'COPILOT_PENDING_ACTION',
        resourceId: pendingAction.actionId,
        requestId: ctx.requestId,
        outcome: 'SUCCESS',
        metadata: {
          actionType: 'CREATE_TASK',
          payload: pendingAction.payload,
        },
      });

      return {
        data: {
          status: 'PROPOSAL_GENERATED',
          actionId: pendingAction.actionId,
          requiresConfirmation: true,
          notice: 'This task will NOT be created until the user explicitly confirms in the UI.',
          proposedTask: {
            customer: `${cust.name} (${cust.customerCode})`,
            title: args.title,
            dueDate: args.dueDate,
            priority: args.priority || 'MEDIUM',
            description: args.description,
          },
        },
        sources: [
          {
            type: 'CUSTOMER',
            id: cust.customerCode,
            label: `${cust.name} (${cust.customerCode})`,
            link: '/customers',
          },
        ],
        pendingConfirmation: {
          action_id: pendingAction.actionId,
          action_type: 'CREATE_TASK',
          title: `Create Task: ${args.title}`,
          summary: `Task for ${cust.name} due on ${args.dueDate}`,
          details: {
            customer: `${cust.name} (${cust.customerCode})`,
            title: args.title,
            dueDate: args.dueDate,
            priority: args.priority || 'MEDIUM',
            description: args.description || 'No additional notes',
          },
          expires_at: new Date(pendingAction.expiresAt).toISOString(),
        },
      };
    }

    case 'proposeCreateFollowup': {
      const cust = await customerService.getCustomerById(args.customerId);
      const pendingAction = pendingActionService.createPendingAction({
        userId: ctx.user.id,
        userName: ctx.user.name,
        actionType: 'CREATE_FOLLOWUP',
        title: `Schedule Follow-up: ${args.title}`,
        summary: `Relationship follow-up for ${cust.name}`,
        payload: {
          customerId: cust.id,
          title: args.title,
          dueDate: args.dueDate,
          notes: args.notes || '',
        },
        customerContext: {
          id: cust.id,
          name: cust.name,
          customerCode: cust.customerCode,
        },
      });

      await auditRepository.createLog({
        actorId: String(ctx.user.id),
        actorName: ctx.user.name,
        action: 'COPILOT_ACTION_PROPOSED',
        resourceType: 'COPILOT_PENDING_ACTION',
        resourceId: pendingAction.actionId,
        requestId: ctx.requestId,
        outcome: 'SUCCESS',
        metadata: { actionType: 'CREATE_FOLLOWUP', payload: pendingAction.payload },
      });

      return {
        data: {
          status: 'PROPOSAL_GENERATED',
          actionId: pendingAction.actionId,
          requiresConfirmation: true,
          proposedFollowup: {
            customer: `${cust.name} (${cust.customerCode})`,
            title: args.title,
            dueDate: args.dueDate,
            notes: args.notes,
          },
        },
        sources: [
          {
            type: 'CUSTOMER',
            id: cust.customerCode,
            label: `${cust.name} (${cust.customerCode})`,
            link: '/customers',
          },
        ],
        pendingConfirmation: {
          action_id: pendingAction.actionId,
          action_type: 'CREATE_FOLLOWUP',
          title: `Schedule Follow-up: ${args.title}`,
          summary: `Follow-up with ${cust.name} on ${args.dueDate}`,
          details: {
            customer: `${cust.name} (${cust.customerCode})`,
            title: args.title,
            dueDate: args.dueDate,
            notes: args.notes || 'Follow-up discussion',
          },
          expires_at: new Date(pendingAction.expiresAt).toISOString(),
        },
      };
    }

    case 'proposeCreateOpportunity': {
      const cust = await customerService.getCustomerById(args.customerId);
      const pendingAction = pendingActionService.createPendingAction({
        userId: ctx.user.id,
        userName: ctx.user.name,
        actionType: 'CREATE_OPPORTUNITY',
        title: `Create Opportunity: ${args.title}`,
        summary: `Pipeline deal for ${cust.name} (Value: ₹${args.expectedValue})`,
        payload: {
          customerId: cust.id,
          title: args.title,
          expectedValue: String(args.expectedValue),
          stage: args.stage || 'PROSPECT',
          probability: args.probability || 50,
        },
        customerContext: {
          id: cust.id,
          name: cust.name,
          customerCode: cust.customerCode,
        },
      });

      await auditRepository.createLog({
        actorId: String(ctx.user.id),
        actorName: ctx.user.name,
        action: 'COPILOT_ACTION_PROPOSED',
        resourceType: 'COPILOT_PENDING_ACTION',
        resourceId: pendingAction.actionId,
        requestId: ctx.requestId,
        outcome: 'SUCCESS',
        metadata: { actionType: 'CREATE_OPPORTUNITY', payload: pendingAction.payload },
      });

      return {
        data: {
          status: 'PROPOSAL_GENERATED',
          actionId: pendingAction.actionId,
          requiresConfirmation: true,
          proposedOpportunity: {
            customer: `${cust.name} (${cust.customerCode})`,
            title: args.title,
            expectedValue: args.expectedValue,
            stage: args.stage || 'PROSPECT',
          },
        },
        sources: [
          {
            type: 'CUSTOMER',
            id: cust.customerCode,
            label: `${cust.name} (${cust.customerCode})`,
            link: '/customers',
          },
        ],
        pendingConfirmation: {
          action_id: pendingAction.actionId,
          action_type: 'CREATE_OPPORTUNITY',
          title: `Create Opportunity: ${args.title}`,
          summary: `Opportunity for ${cust.name} (Value: ₹${args.expectedValue})`,
          details: {
            customer: `${cust.name} (${cust.customerCode})`,
            title: args.title,
            expectedValue: `₹${args.expectedValue}`,
            stage: args.stage || 'PROSPECT',
            probability: `${args.probability || 50}%`,
          },
          expires_at: new Date(pendingAction.expiresAt).toISOString(),
        },
      };
    }

    case 'proposeUpdateCase': {
      const caseItem = await caseService.getCaseById(args.caseId);
      const pendingAction = pendingActionService.createPendingAction({
        userId: ctx.user.id,
        userName: ctx.user.name,
        actionType: 'UPDATE_CASE',
        title: `Update Service Case #${caseItem.caseNumber}`,
        summary: `Change status to ${args.status || caseItem.status}`,
        payload: {
          caseId: caseItem.id,
          status: args.status,
          priority: args.priority,
          resolutionSummary: args.resolutionSummary,
        },
      });

      await auditRepository.createLog({
        actorId: String(ctx.user.id),
        actorName: ctx.user.name,
        action: 'COPILOT_ACTION_PROPOSED',
        resourceType: 'COPILOT_PENDING_ACTION',
        resourceId: pendingAction.actionId,
        requestId: ctx.requestId,
        outcome: 'SUCCESS',
        metadata: { actionType: 'UPDATE_CASE', payload: pendingAction.payload },
      });

      return {
        data: {
          status: 'PROPOSAL_GENERATED',
          actionId: pendingAction.actionId,
          requiresConfirmation: true,
          proposedCaseUpdate: {
            caseNumber: caseItem.caseNumber,
            currentStatus: caseItem.status,
            proposedStatus: args.status,
            resolutionSummary: args.resolutionSummary,
          },
        },
        sources: [
          {
            type: 'CASE',
            id: caseItem.caseNumber,
            label: `Case #${caseItem.caseNumber}`,
            link: '/service-desk',
          },
        ],
        pendingConfirmation: {
          action_id: pendingAction.actionId,
          action_type: 'UPDATE_CASE',
          title: `Update Case #${caseItem.caseNumber}`,
          summary: `Update status to ${args.status || caseItem.status}`,
          details: {
            caseNumber: caseItem.caseNumber,
            newStatus: args.status || caseItem.status,
            resolutionSummary: args.resolutionSummary || 'Case status modification',
          },
          expires_at: new Date(pendingAction.expiresAt).toISOString(),
        },
      };
    }

    case 'getMyNotifications': {
      const result = await notificationService.getUserNotifications(ctx.user.id, {
        status: args.status,
        category: args.category,
        severity: args.severity,
        limit: Math.min(25, args.limit || 10),
      });

      result.data.forEach((n) => {
        sources.push({
          type: 'NOTIFICATION',
          id: String(n.id),
          label: `Alert: ${n.title} (${n.severity})`,
          link: n.actionUrl || '/notifications',
          preview: n.message,
        });
      });

      return {
        data: {
          total: result.total,
          returned: result.data.length,
          alerts: result.data.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            category: n.category,
            severity: n.severity,
            status: n.status,
            customerName: n.customerName,
            actionLabel: n.actionLabel,
            actionUrl: n.actionUrl,
            createdAt: n.createdAt,
          })),
        },
        sources,
      };
    }

    case 'getNotificationSummary': {
      const summary = await notificationService.getSummaryStats(ctx.user.id);
      return {
        data: {
          summary,
          operationalStatus: summary.criticalCount > 0 ? 'CRITICAL_ATTENTION_REQUIRED' : summary.warningCount > 0 ? 'WARNINGS_PENDING' : 'OPTIMAL',
        },
        sources: [
          {
            type: 'NOTIFICATION',
            id: 'summary',
            label: 'Notification Center Summary',
            link: '/notifications',
            preview: `Unread: ${summary.unreadCount}, Critical: ${summary.criticalCount}, Warnings: ${summary.warningCount}`,
          },
        ],
      };
    }

    case 'explainNotification': {
      const notifId = Number(args.notificationId);
      const notif = await notificationService.getNotificationById(notifId, ctx.user.id);
      if (!notif) {
        throw new BankingError('NOT_FOUND', `Notification alert #${notifId} not found or access denied.`, 404);
      }

      let explanation = '';
      let recommendedAction = '';

      switch (notif.category) {
        case 'SERVICE':
          explanation = `This alert is governed by Service Desk SLAs. ${notif.message}`;
          recommendedAction = 'Review customer ticket, verify resolution milestones, or reassign if specialized support is needed.';
          break;
        case 'TASK':
          explanation = `This alert tracks officer follow-up commitments. ${notif.message}`;
          recommendedAction = 'Complete scheduled touchpoint or reschedule due date with client justification.';
          break;
        case 'OPPORTUNITY':
          explanation = `This alert tracks pipeline velocity and closing milestones. ${notif.message}`;
          recommendedAction = 'Engage decision maker, clarify terms, or adjust deal timeline.';
          break;
        case 'RELATIONSHIP':
          explanation = `This alert reflects changes in relationship health (CORE score delta or intelligence signal). ${notif.message}`;
          recommendedAction = 'Schedule proactive relationship review to address emerging customer risks.';
          break;
        default:
          explanation = notif.message;
          recommendedAction = 'Review alert details and acknowledge in notification center.';
      }

      sources.push({
        type: 'NOTIFICATION',
        id: String(notif.id),
        label: `Alert #${notif.id}: ${notif.title}`,
        link: notif.actionUrl || '/notifications',
        preview: notif.message,
      });

      return {
        data: {
          id: notif.id,
          title: notif.title,
          category: notif.category,
          severity: notif.severity,
          status: notif.status,
          customerName: notif.customerName,
          sourceEntityType: notif.sourceEntityType,
          sourceEntityId: notif.sourceEntityId,
          explanation,
          recommendedAction,
          createdAt: notif.createdAt,
        },
        sources,
      };
    }

    case 'proposeAcknowledgeNotification': {
      const notifId = Number(args.notificationId);
      const notif = await notificationService.getNotificationById(notifId, ctx.user.id);
      if (!notif) {
        throw new BankingError('NOT_FOUND', `Notification #${notifId} not found or access denied.`, 404);
      }

      const pendingAction = pendingActionService.createPendingAction({
        userId: ctx.user.id,
        userName: ctx.user.name,
        actionType: 'ACKNOWLEDGE_NOTIFICATION',
        title: `Acknowledge Alert #${notif.id}`,
        summary: `Acknowledge alert "${notif.title}" (${notif.severity})`,
        payload: {
          notificationId: notif.id,
          notes: args.notes || 'Acknowledged via Copilot',
        },
        customerContext: notif.customerId && notif.customerName ? {
          id: notif.customerId,
          name: notif.customerName,
          customerCode: notif.customerCode || '',
        } : undefined,
      });

      await auditRepository.createLog({
        actorId: String(ctx.user.id),
        actorName: ctx.user.name,
        action: 'COPILOT_ACTION_PROPOSED',
        resourceType: 'COPILOT_PENDING_ACTION',
        resourceId: pendingAction.actionId,
        requestId: ctx.requestId,
        outcome: 'SUCCESS',
        metadata: { actionType: 'ACKNOWLEDGE_NOTIFICATION', payload: pendingAction.payload },
      });

      return {
        data: {
          status: 'PROPOSAL_GENERATED',
          actionId: pendingAction.actionId,
          requiresConfirmation: true,
          alert: {
            id: notif.id,
            title: notif.title,
            severity: notif.severity,
            status: notif.status,
          },
        },
        sources: [
          {
            type: 'NOTIFICATION',
            id: String(notif.id),
            label: `Alert #${notif.id}: ${notif.title}`,
            link: '/notifications',
          },
        ],
        pendingConfirmation: {
          action_id: pendingAction.actionId,
          action_type: 'ACKNOWLEDGE_NOTIFICATION',
          title: `Acknowledge Alert: ${notif.title}`,
          summary: `Confirm acknowledgment of ${notif.severity} alert. This records officer review in the audit log.`,
          details: {
            notificationId: notif.id,
            severity: notif.severity,
            category: notif.category,
            notes: args.notes || 'Officer acknowledgment',
          },
          expires_at: new Date(pendingAction.expiresAt).toISOString(),
        },
      };
    }

    case 'proposeDismissNotification': {
      const notifId = Number(args.notificationId);
      const notif = await notificationService.getNotificationById(notifId, ctx.user.id);
      if (!notif) {
        throw new BankingError('NOT_FOUND', `Notification #${notifId} not found or access denied.`, 404);
      }

      const pendingAction = pendingActionService.createPendingAction({
        userId: ctx.user.id,
        userName: ctx.user.name,
        actionType: 'DISMISS_NOTIFICATION',
        title: `Dismiss Alert #${notif.id}`,
        summary: `Dismiss alert "${notif.title}"`,
        payload: {
          notificationId: notif.id,
          reason: args.reason || 'Dismissed via Copilot',
        },
        customerContext: notif.customerId && notif.customerName ? {
          id: notif.customerId,
          name: notif.customerName,
          customerCode: notif.customerCode || '',
        } : undefined,
      });

      await auditRepository.createLog({
        actorId: String(ctx.user.id),
        actorName: ctx.user.name,
        action: 'COPILOT_ACTION_PROPOSED',
        resourceType: 'COPILOT_PENDING_ACTION',
        resourceId: pendingAction.actionId,
        requestId: ctx.requestId,
        outcome: 'SUCCESS',
        metadata: { actionType: 'DISMISS_NOTIFICATION', payload: pendingAction.payload },
      });

      return {
        data: {
          status: 'PROPOSAL_GENERATED',
          actionId: pendingAction.actionId,
          requiresConfirmation: true,
          alert: {
            id: notif.id,
            title: notif.title,
            severity: notif.severity,
            status: notif.status,
          },
        },
        sources: [
          {
            type: 'NOTIFICATION',
            id: String(notif.id),
            label: `Alert #${notif.id}: ${notif.title}`,
            link: '/notifications',
          },
        ],
        pendingConfirmation: {
          action_id: pendingAction.actionId,
          action_type: 'DISMISS_NOTIFICATION',
          title: `Dismiss Alert: ${notif.title}`,
          summary: `Confirm dismissal of alert. This removes the item from your active queue.`,
          details: {
            notificationId: notif.id,
            reason: args.reason || 'Officer dismissal',
          },
          expires_at: new Date(pendingAction.expiresAt).toISOString(),
        },
      };
    }

    case 'getAnalyticsOverview': {
      const userAudit = {
        userId: ctx.user.id,
        employeeId: ctx.user.employeeId,
        name: ctx.user.name,
        role: ctx.user.role,
      };
      const data = await analyticsService.getExecutiveOverview({ period: args.period }, userAudit);
      return {
        data,
        sources: [
          {
            type: 'ANALYTICS',
            id: 'EXECUTIVE_OVERVIEW',
            label: `Executive Analytics Overview (${data.period})`,
            link: '/analytics',
          },
        ],
      };
    }

    case 'getPortfolioAnalytics': {
      const userAudit = {
        userId: ctx.user.id,
        employeeId: ctx.user.employeeId,
        name: ctx.user.name,
        role: ctx.user.role,
      };
      const data = await analyticsService.getRelationshipPortfolio({
        period: args.period,
        branch: args.branch,
        segment: args.segment,
      }, userAudit);
      return {
        data,
        sources: [
          {
            type: 'ANALYTICS',
            id: 'RELATIONSHIP_PORTFOLIO',
            label: `Relationship Portfolio Analytics (${data.summary.totalCustomers} customers, TRV: ${data.summary.formattedTotalValue})`,
            link: '/analytics?tab=portfolio',
          },
        ],
      };
    }

    case 'getCustomerHealthAnalytics': {
      const userAudit = {
        userId: ctx.user.id,
        employeeId: ctx.user.employeeId,
        name: ctx.user.name,
        role: ctx.user.role,
      };
      const data = await analyticsService.getCustomerHealth({ scoreBand: args.scoreBand }, userAudit);
      return {
        data,
        sources: [
          {
            type: 'ANALYTICS',
            id: 'CUSTOMER_HEALTH',
            label: `Customer Health Analytics (Avg CORE Score: ${data.metrics.averageCoreScore})`,
            link: '/analytics?tab=health',
          },
        ],
      };
    }

    case 'getOpportunityAnalytics': {
      const userAudit = {
        userId: ctx.user.id,
        employeeId: ctx.user.employeeId,
        name: ctx.user.name,
        role: ctx.user.role,
      };
      const data = await analyticsService.getOpportunityAnalytics({ oppStage: args.oppStage }, userAudit);
      return {
        data,
        sources: [
          {
            type: 'ANALYTICS',
            id: 'OPPORTUNITIES',
            label: `Opportunity Pipeline Analytics (${data.summary.activeOpportunities} active deals, Pipeline: ${data.summary.formattedTotalPipelineValue})`,
            link: '/analytics?tab=opportunities',
          },
        ],
      };
    }

    case 'getServicePerformanceAnalytics': {
      const userAudit = {
        userId: ctx.user.id,
        employeeId: ctx.user.employeeId,
        name: ctx.user.name,
        role: ctx.user.role,
      };
      const data = await analyticsService.getServicePerformance({ caseStatus: args.caseStatus }, userAudit);
      return {
        data,
        sources: [
          {
            type: 'ANALYTICS',
            id: 'SERVICE_PERFORMANCE',
            label: `Service Desk Analytics (${data.metrics.slaCompliancePercentage}% SLA Compliance)`,
            link: '/analytics?tab=service',
          },
        ],
      };
    }

    case 'getProductPenetrationAnalytics': {
      const userAudit = {
        userId: ctx.user.id,
        employeeId: ctx.user.employeeId,
        name: ctx.user.name,
        role: ctx.user.role,
      };
      const data = await analyticsService.getProductPenetration({}, userAudit);
      return {
        data,
        sources: [
          {
            type: 'ANALYTICS',
            id: 'PRODUCT_PENETRATION',
            label: `Product Penetration Analytics (${data.summary.totalActiveEnrollments} active enrollments)`,
            link: '/analytics?tab=products',
          },
        ],
      };
    }

    case 'getWhatChanged': {
      const userAudit = {
        userId: ctx.user.id,
        employeeId: ctx.user.employeeId,
        name: ctx.user.name,
        role: ctx.user.role,
      };
      const data = await analyticsService.getWhatChanged({ period: args.period }, userAudit);
      return {
        data,
        sources: [
          {
            type: 'ANALYTICS',
            id: 'WHAT_CHANGED',
            label: `What Changed Comparison (${data.currentPeriod} vs ${data.comparisonPeriod})`,
            link: '/analytics?tab=trends',
          },
        ],
      };
    }

    case 'searchDocuments': {
      const actorContext = {
        userId: ctx.user.id,
        userName: ctx.user.name,
        role: ctx.user.role,
        requestId: ctx.requestId,
      };
      const result = await documentService.listDocuments(
        {
          customerId: args.customerId,
          search: args.search,
          documentType: args.documentType,
          status: args.status,
          reviewStatus: args.reviewStatus,
          limit: args.limit || 5,
        },
        actorContext
      );

      return {
        data: result.items.map((d: any) => ({
          id: d.id,
          documentCode: d.documentCode,
          title: d.fileName || d.documentType,
          documentType: d.documentType,
          category: d.category,
          status: d.status,
          reviewStatus: d.reviewStatus,
          customerName: d.customerName,
          expiryDate: d.expiryDate,
        })),
        sources: result.items.slice(0, 3).map((d: any) => ({
          type: 'DOCUMENT',
          id: d.documentCode,
          label: `${d.fileName || d.documentType} (${d.documentCode}) · ${d.status}`,
          link: `/documents?id=${d.id}`,
        })),
      };
    }

    case 'getDocumentDetails': {
      const actorContext = {
        userId: ctx.user.id,
        userName: ctx.user.name,
        role: ctx.user.role,
        requestId: ctx.requestId,
      };

      let docId = args.documentId;
      if (!docId && args.documentCode) {
        const found = await documentService.listDocuments({ search: args.documentCode, limit: 1 }, actorContext);
        if (found.items.length > 0) {
          docId = found.items[0].id;
        }
      }

      if (!docId) {
        throw new BankingError('DOCUMENT_NOT_FOUND', 'Document reference not found.', 404);
      }

      const doc = await documentService.getDocumentById(docId, actorContext);
      const docName = doc.fileName || doc.documentType;
      return {
        data: {
          id: doc.id,
          documentCode: doc.documentCode,
          title: docName,
          documentType: doc.documentType,
          category: doc.category,
          status: doc.status,
          reviewStatus: doc.reviewStatus,
          customerName: doc.customerName,
          currentVersion: doc.version,
          versionsCount: doc.versions?.length || 1,
          reviewsCount: doc.reviews?.length || 0,
          expiryDate: doc.expiryDate,
          rejectionReason: doc.rejectionReason,
        },
        sources: [
          {
            type: 'DOCUMENT',
            id: doc.documentCode,
            label: `${docName} (${doc.documentCode})`,
            link: `/documents?id=${doc.id}`,
          },
        ],
      };
    }

    case 'getCustomerDocumentRequirements': {
      let custId = args.customerId;
      if (!custId && args.customerCode) {
        const c = await customerService.getCustomerById(args.customerCode);
        if (c) custId = c.id;
      }
      if (!custId) {
        throw new BankingError('CUSTOMER_NOT_FOUND', 'Customer ID or code is required to check document requirements.', 400);
      }

      const reqData = await documentService.getCustomerRequirements(custId);
      const customer = await customerService.getCustomerById(custId);
      return {
        data: reqData,
        sources: [
          {
            type: 'CUSTOMER',
            id: String(custId),
            label: `Customer ${customer?.name || custId} Requirements (${reqData.summary.missingCount} missing, ${reqData.summary.replacementCount} replacement)`,
            link: `/customers`,
          },
        ],
      };
    }

    case 'reviewDocumentAction': {
      const actorContext = {
        userId: ctx.user.id,
        userName: ctx.user.name,
        role: ctx.user.role,
        requestId: ctx.requestId,
      };

      const doc = await documentService.getDocumentById(args.documentId, actorContext);
      const decision = String(args.decision).toUpperCase();
      const docName = doc.fileName || doc.documentType;

      let actionType: any = 'VERIFY_DOCUMENT';
      let title = `Verify Document: ${docName}`;
      let summary = `Approve and verify ${docName} (${doc.documentCode}) for ${doc.customerName || 'Customer'}.`;

      if (decision === 'REJECT') {
        actionType = 'REJECT_DOCUMENT';
        title = `Reject Document: ${docName}`;
        summary = `Reject ${docName} (${doc.documentCode}). Reason: ${args.reason || 'Document does not meet policy guidelines'}. An RM remediation task will be generated.`;
      } else if (decision === 'REQUEST_REPLACEMENT') {
        actionType = 'REQUEST_DOCUMENT_REPLACEMENT';
        title = `Request Replacement: ${docName}`;
        summary = `Request updated version of ${docName} (${doc.documentCode}). Reason: ${args.reason || 'Expired or unreadable'}.`;
      }

      const pending = pendingActionService.createPendingAction({
        userId: ctx.user.id,
        userName: ctx.user.name,
        actionType,
        title,
        summary,
        payload: {
          documentId: doc.id,
          documentCode: doc.documentCode,
          customerId: doc.customerId,
          decision,
          comments: args.reason,
          reason: args.reason,
          requestedDocType: args.requestedDocType || doc.documentType,
          dueDate: args.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        },
        customerContext: {
          id: doc.customerId,
          name: doc.customerName,
          customerCode: doc.customerCode || undefined,
        },
      });

      return {
        data: {
          status: 'PENDING_CONFIRMATION',
          actionId: pending.actionId,
          title,
          summary,
        },
        sources: [
          {
            type: 'DOCUMENT',
            id: doc.documentCode,
            label: `${docName} (${doc.documentCode})`,
            link: `/documents?id=${doc.id}`,
          },
        ],
        pendingConfirmation: {
          action_id: pending.actionId,
          action_type: pending.actionType,
          title: pending.title,
          summary: pending.summary,
          details: pending.payload,
        },
      };
    }

    case 'getRelationshipTwin': {
      const customer = await customerService.getCustomerById(args.customerId);
      const twin = await relationshipTwinService.getRelationshipTwin(customer.id, {
        id: ctx.user.id,
        role: ctx.user.role,
        name: ctx.user.name,
      });

      sources.push({
        type: 'CUSTOMER',
        id: twin.customer.customerCode,
        label: `Relationship Twin · ${twin.customer.name} (${twin.state.state})`,
        link: `/relationship-twin?customerId=${twin.customer.id}`,
      });

      return {
        data: {
          customer: twin.customer,
          state: twin.state.state,
          previousState: twin.state.previousState,
          reason: twin.state.reason,
          coreScore: twin.header.coreScore,
          relationshipMomentum: twin.header.relationshipMomentum,
          whyThisState: twin.whyThisState,
          whatChanged: twin.whatChanged,
          healthBreakdown: twin.healthBreakdown,
          activeSignalsCount: twin.signals.filter((s: any) => s.status === 'ACTIVE').length,
          openCasesCount: twin.header.openCasesCount,
          openOpportunitiesCount: twin.header.openOpportunitiesCount,
          beforeYouActSummary: twin.beforeYouAct.recommendedPrecautions,
        },
        sources,
      };
    }

    case 'getBeforeYouActAdvisory': {
      const customer = await customerService.getCustomerById(args.customerId);
      const twin = await relationshipTwinService.getRelationshipTwin(customer.id, {
        id: ctx.user.id,
        role: ctx.user.role,
        name: ctx.user.name,
      });

      sources.push({
        type: 'CUSTOMER',
        id: twin.customer.customerCode,
        label: `Before You Act Advisory · ${twin.customer.name}`,
        link: `/relationship-twin?customerId=${twin.customer.id}`,
      });

      return {
        data: twin.beforeYouAct,
        sources,
      };
    }

    case 'getRelationshipGraph': {
      const eType = String(args.entityType || 'CUSTOMER').toUpperCase();
      const eId = args.entityId || args.customerId;
      const depth = Number(args.depth || 1);
      const graph = await relationshipGraphService.getRelationshipGraph(
        eType,
        eId,
        ctx.user as any,
        { depth },
        ctx.requestId
      );

      sources.push({
        type: 'CUSTOMER',
        id: String(graph.root.code || graph.root.entityId),
        label: `Relationship Graph · ${graph.root.label} (${graph.root.code})`,
        link: `/relationship-graph?entityType=${graph.root.entityType}&entityId=${graph.root.code || graph.root.entityId}`,
      });

      for (const node of graph.nodes) {
        if (node.entityType === 'OPPORTUNITY') {
          sources.push({
            type: 'OPPORTUNITY',
            id: String(node.code),
            label: `Opportunity · ${node.label} (${node.code})`,
            link: '/opportunities',
          });
        } else if (node.entityType === 'SERVICE_CASE') {
          sources.push({
            type: 'CASE',
            id: String(node.code),
            label: `Service Case · ${node.label} (${node.code})`,
            link: '/service-desk',
          });
        }
      }

      return {
        data: {
          root: graph.root,
          nodeCount: graph.meta.nodeCount,
          edgeCount: graph.meta.edgeCount,
          depth: graph.meta.depth,
          entityTypeCounts: graph.meta.entityTypeCounts,
          relationshipTypeCounts: graph.meta.relationshipTypeCounts,
          summaryBreakdown: `${graph.root.label} is connected to ${graph.meta.entityTypeCounts.PRODUCT || 0} banking products, ${graph.meta.entityTypeCounts.OPPORTUNITY || 0} active opportunities, ${graph.meta.entityTypeCounts.SERVICE_CASE || 0} open service cases, and ${graph.meta.entityTypeCounts.INTERACTION || 0} interactions.`,
          connectedNodes: graph.nodes.map((n) => ({
            id: n.id,
            entityType: n.entityType,
            code: n.code,
            label: n.label,
            status: n.status,
            depth: n.depth,
          })),
        },
        sources,
      };
    }

    case 'getRelationshipNeighbors': {
      const eType = String(args.entityType || 'CUSTOMER').toUpperCase();
      const eId = args.entityId || args.customerId;
      const neighborsResult = await relationshipGraphService.getRelationshipNeighbors(
        eType,
        eId,
        ctx.user as any,
        ctx.requestId
      );

      sources.push({
        type: 'CUSTOMER',
        id: String(neighborsResult.root.code || neighborsResult.root.entityId),
        label: `Relationship Neighbors · ${neighborsResult.root.label}`,
        link: `/relationship-graph?entityType=${neighborsResult.root.entityType}&entityId=${neighborsResult.root.code}`,
      });

      return {
        data: neighborsResult,
        sources,
      };
    }

    case 'getRelationshipPath': {
      const pathResult = await relationshipGraphService.findRelationshipPath(
        args.sourceType,
        args.sourceId,
        args.targetType,
        args.targetId,
        ctx.user as any,
        ctx.requestId
      );

      sources.push({
        type: 'CUSTOMER',
        id: `${args.sourceType}:${args.sourceId}`,
        label: `Relationship Path · ${args.sourceType} to ${args.targetType}`,
        link: `/relationship-graph`,
      });

      return {
        data: pathResult,
        sources,
      };
    }

    case 'getRelationshipEvidence': {
      const evidence = await relationshipGraphService.getRelationshipEvidence(
        args.edgeId,
        ctx.user as any,
        ctx.requestId
      );

      sources.push({
        type: 'CUSTOMER',
        id: args.edgeId,
        label: `Relationship Provenance Evidence · ${args.edgeId}`,
        link: `/relationship-graph`,
      });

      return {
        data: evidence,
        sources,
      };
    }

    case 'getDecisionTrace': {
      const trace = await decisionTraceService.getDecisionTrace(
        args.decisionId,
        ctx.user as any,
        ctx.requestId
      );

      sources.push({
        type: 'CUSTOMER',
        id: trace.decisionId,
        label: `Decision Trace · ${trace.decisionId} (${trace.recommendationTitle})`,
        link: `/customers?tab=decisions&traceId=${trace.decisionId}`,
      });

      return {
        data: trace,
        sources,
      };
    }

    case 'getDecisionEvidence': {
      const evidence = await decisionTraceService.getDecisionEvidence(
        args.decisionId,
        ctx.user as any,
        ctx.requestId
      );

      sources.push({
        type: 'CUSTOMER',
        id: args.decisionId,
        label: `Decision Evidence · ${args.decisionId}`,
        link: `/customers?tab=decisions&traceId=${args.decisionId}`,
      });

      return {
        data: evidence,
        sources,
      };
    }

    case 'getDecisionSources': {
      const sourceNodes = await decisionTraceService.getDecisionSources(
        args.decisionId,
        ctx.user as any,
        ctx.requestId
      );

      sources.push({
        type: 'CUSTOMER',
        id: args.decisionId,
        label: `Decision Source Chain · ${args.decisionId}`,
        link: `/customers?tab=decisions&traceId=${args.decisionId}`,
      });

      return {
        data: sourceNodes,
        sources,
      };
    }

    case 'getDecisionHistory': {
      const customerId = parseInt(String(args.customerId), 10);
      const history = await decisionTraceService.getDecisionHistory(
        customerId,
        ctx.user as any,
        ctx.requestId
      );

      sources.push({
        type: 'CUSTOMER',
        id: String(customerId),
        label: `Decision History · Customer #${customerId}`,
        link: `/customers?tab=decisions`,
      });

      return {
        data: history,
        sources,
      };
    }

    case 'createStrategyScenario': {
      const scenario = await strategySimulatorService.createScenario(
        {
          customerId: Number(args.customerId),
          name: args.name,
          description: args.description,
          actions: args.actions || [],
        },
        ctx.user as any
      );

      sources.push({
        type: 'CUSTOMER',
        id: scenario.scenarioId,
        label: `Strategy Scenario · ${scenario.scenarioId} (${scenario.name})`,
        link: `/strategy-simulator?scenarioId=${scenario.scenarioId}`,
      });

      return {
        data: {
          ...scenario,
          notice: 'SIMULATION ONLY — Customer production data is unmodified.',
        },
        sources,
      };
    }

    case 'simulateStrategyScenario': {
      let simResult;
      if (args.scenarioId) {
        const scenario = await strategySimulatorService.simulateExistingScenario(args.scenarioId, ctx.user as any);
        simResult = {
          scenarioId: scenario.scenarioId,
          status: scenario.status,
          baseSnapshot: scenario.baseSnapshot,
          resultSnapshot: scenario.resultSnapshot,
          comparisons: scenario.comparisons,
          decisionTraceId: scenario.decisionTraceId,
          isSimulation: true,
          simulationDisclaimer: 'SIMULATION — NOT PRODUCTION DATA. Deterministic impact based on currently available COREvia relationship data and rules.',
        };
      } else {
        simResult = await strategySimulatorService.simulateScenario(
          {
            customerId: Number(args.customerId),
            actions: args.actions || [],
            scenarioName: 'Ad-hoc Copilot Simulation',
          },
          ctx.user as any
        );
      }

      sources.push({
        type: 'CUSTOMER',
        id: simResult.scenarioId || 'SIMULATION',
        label: `Strategy Simulation · ${simResult.scenarioId}`,
        link: `/strategy-simulator?customerId=${args.customerId}`,
      });

      return {
        data: simResult,
        sources,
      };
    }

    case 'getStrategyScenario': {
      const scenario = await strategySimulatorService.getScenario(args.scenarioId, ctx.user as any);
      sources.push({
        type: 'CUSTOMER',
        id: scenario.scenarioId,
        label: `Strategy Scenario · ${scenario.scenarioId}`,
        link: `/strategy-simulator?scenarioId=${scenario.scenarioId}`,
      });
      return {
        data: scenario,
        sources,
      };
    }

    case 'compareStrategyScenario': {
      const comparison = await strategySimulatorService.compareScenarios(
        args.baseScenarioId,
        args.targetScenarioId,
        ctx.user as any
      );
      sources.push({
        type: 'CUSTOMER',
        id: `${args.baseScenarioId}_vs_${args.targetScenarioId}`,
        label: `Scenario Comparison · ${args.baseScenarioId} vs ${args.targetScenarioId}`,
        link: `/strategy-simulator?compare=${args.baseScenarioId}&with=${args.targetScenarioId}`,
      });
      return {
        data: comparison,
        sources,
      };
    }

    case 'getScenarioTrace': {
      const scenario = await strategySimulatorService.getScenario(args.scenarioId, ctx.user as any);
      if (!scenario.decisionTraceId) {
        return {
          data: {
            scenarioId: scenario.scenarioId,
            message: 'No decision trace has been generated for this scenario yet. Run a simulation first.',
          },
          sources,
        };
      }
      const trace = await decisionTraceService.getDecisionTrace(
        scenario.decisionTraceId,
        ctx.user as any,
        ctx.requestId
      );
      sources.push({
        type: 'CUSTOMER',
        id: trace.decisionId,
        label: `Scenario Decision Trace · ${trace.decisionId}`,
        link: `/customers?tab=decisions&traceId=${trace.decisionId}`,
      });
      return {
        data: trace,
        sources,
      };
    }

    // Phase 31: Governed Agent Copilot Handlers
    case 'createAgentPlan': {
      const plan = await agentPlanningService.createPlanFromSignalOrNba(
        Number(args.customerId),
        'COPILOT',
        String(args.title),
        String(args.objective),
        ctx.user as any,
        ctx.requestId
      );
      sources.push({
        type: 'CUSTOMER',
        id: plan.planId,
        label: `Agent Plan · ${plan.planId}`,
        link: `/agent?planId=${plan.planId}`,
      });
      return {
        data: plan,
        sources,
      };
    }

    case 'validateAgentPlan': {
      const plan = await agentRepository.findPlanById(args.planId);
      if (!plan) throw new BankingError('PLAN_NOT_FOUND', `Plan ${args.planId} not found.`, 404);
      const validation = await agentPlanningService.validatePlanDefinition(plan.steps, plan.customerId, ctx.user as any);
      return {
        data: { planId: plan.planId, ...validation },
        sources,
      };
    }

    case 'getAgentPlan': {
      const plan = await agentRepository.findPlanById(args.planId);
      if (!plan) throw new BankingError('PLAN_NOT_FOUND', `Plan ${args.planId} not found.`, 404);
      sources.push({
        type: 'CUSTOMER',
        id: plan.planId,
        label: `Agent Plan · ${plan.planId}`,
        link: `/agent?planId=${plan.planId}`,
      });
      return {
        data: plan,
        sources,
      };
    }

    case 'approveAgentPlan': {
      const approved = await agentPlanningService.approvePlan(
        args.planId,
        args.approvedStepNumbers,
        ctx.user as any,
        ctx.requestId
      );
      sources.push({
        type: 'CUSTOMER',
        id: approved.planId,
        label: `Approved Plan · ${approved.planId}`,
        link: `/agent?planId=${approved.planId}`,
      });
      return {
        data: approved,
        sources,
      };
    }

    case 'rejectAgentPlan': {
      const rejected = await agentPlanningService.rejectPlan(
        args.planId,
        String(args.reason || 'Rejected by officer via Copilot.'),
        ctx.user as any,
        ctx.requestId
      );
      return {
        data: rejected,
        sources,
      };
    }

    case 'executeAgentPlan': {
      const report = await agentExecutionService.executePlan(
        args.planId,
        ctx.user as any,
        ctx.requestId
      );
      sources.push({
        type: 'CUSTOMER',
        id: report.planId,
        label: `Execution Report · ${report.planId}`,
        link: `/agent?planId=${report.planId}`,
      });
      return {
        data: report,
        sources,
      };
    }

    case 'getAgentExecution': {
      const plan = await agentRepository.findPlanById(args.planId);
      if (!plan) throw new BankingError('PLAN_NOT_FOUND', `Plan ${args.planId} not found.`, 404);
      return {
        data: {
          planId: plan.planId,
          status: plan.status,
          totalSteps: plan.steps.length,
          completedSteps: plan.steps.filter(s => s.status === 'COMPLETED').length,
          failedSteps: plan.steps.filter(s => s.status === 'FAILED').length,
          skippedSteps: plan.steps.filter(s => s.status === 'SKIPPED').length,
          steps: plan.steps,
        },
        sources,
      };
    }

    case 'getAgentAudit': {
      const plan = await agentRepository.findPlanById(args.planId);
      if (!plan) throw new BankingError('PLAN_NOT_FOUND', `Plan ${args.planId} not found.`, 404);
      const auditRefs = plan.steps
        .filter(s => s.auditLogId !== null && s.auditLogId !== undefined)
        .map(s => ({
          stepNumber: s.stepNumber,
          action: s.actionType,
          auditLogId: s.auditLogId,
          completedAt: s.completedAt,
        }));
      return {
        data: {
          planId: plan.planId,
          status: plan.status,
          auditReferences: auditRefs,
        },
        sources,
      };
    }

    // Phase 32: Relationship Value Copilot Handlers
    case 'getRelationshipValueProfile': {
      const custId = Number(args.customerId) || 1;
      const cust = await customerService.getCustomerById(custId);
      const profile = await relationshipValueService.getCurrentProfile(custId, ctx.user as any, ctx.requestId);
      sources.push({
        type: 'CUSTOMER',
        id: String(custId),
        label: `Relationship Value Profile · ${cust?.name || 'Customer'}`,
        link: `/customers?id=${custId}&tab=value`,
      });
      return {
        data: {
          classification: {
            type: 'FACT',
            facts: [
              `Current CORE Score: ${profile.baseSnapshot.coreScore}`,
              `Total Relationship Value: ${profile.baseSnapshot.relationshipValueFormatted}`,
              `Product Depth: ${profile.baseSnapshot.productDepth} facilities`,
              `Service Health: ${profile.baseSnapshot.serviceHealth}`,
              `Engagement Score: ${profile.baseSnapshot.engagement}`,
            ],
            interpretations: [profile.explanation],
            limitations: profile.limitations,
          },
          profile,
        },
        sources,
      };
    }

    case 'getRelationshipValueHistory': {
      const custId = Number(args.customerId) || 1;
      const cust = await customerService.getCustomerById(custId);
      const history = await relationshipValueService.getHistory(custId, ctx.user as any, ctx.requestId);
      sources.push({
        type: 'CUSTOMER',
        id: String(custId),
        label: `Relationship History · ${cust?.name || 'Customer'}`,
        link: `/customers?id=${custId}&tab=value`,
      });
      return {
        data: {
          classification: {
            type: 'FACT',
            facts: [
              `Historical snapshot count: ${history.trendSummary?.recordCount || history.timeline?.length || 0}`,
              `CORE Score trend: ${history.trendSummary?.coreScoreTrend || 'STABLE'}`,
              `Earliest recorded snapshot: ${history.trendSummary?.earliestDate || 'N/A'}`,
            ],
            interpretations: [history.notice || 'Historical records loaded from governed database ledger.'],
            limitations: ['Historical data reflects recorded book values at snapshot dates.'],
          },
          history,
        },
        sources,
      };
    }

    case 'compareRelationshipValueScenario': {
      const custId = Number(args.customerId) || 1;
      const cust = await customerService.getCustomerById(custId);
      let comparison;
      if (args.scenarioId) {
        comparison = await relationshipValueService.compareScenario(custId, args.scenarioId, ctx.user as any, ctx.requestId);
      } else {
        const actionTypes = Array.isArray(args.scenarioActions) && args.scenarioActions.length > 0
          ? args.scenarioActions
          : ['RESOLVE_SERVICE_CASE', 'SCHEDULE_RELATIONSHIP_REVIEW'];
        comparison = await relationshipValueService.simulateAndCompareScenario(
          custId,
          {
            name: 'Copilot Strategy Scenario',
            actions: actionTypes.map((t: string, i: number) => ({ actionType: t as any, orderIndex: i })),
          },
          ctx.user as any,
          ctx.requestId
        );
      }

      sources.push({
        type: 'CUSTOMER',
        id: String(comparison.scenarioId || 'SCENARIO'),
        label: `Scenario Value Comparison · ${comparison.scenarioName || 'Simulation'}`,
        link: `/strategy-simulator?scenarioId=${comparison.scenarioId}`,
      });
      return {
        data: {
          classification: {
            type: 'SCENARIO',
            scenarios: [
              `Simulated Scenario: ${comparison.scenarioName || comparison.scenarioId}`,
              `Projected CORE Score: ${comparison.scenarioSnapshot?.coreScore}`,
              `Simulated Service Health: ${comparison.scenarioSnapshot?.serviceHealth}`,
            ],
            interpretations: [comparison.explanation],
            limitations: comparison.limitations,
          },
          comparison,
          limitations: [
            'LIMITATION: Monetary relationship value is not recalculated.',
            'LIMITATION: Strategic projections require operational approval before realization.',
          ],
        },
        sources,
      };
    }

    case 'explainRelationshipValueChange': {
      const custId = Number(args.customerId) || 1;
      const cust = await customerService.getCustomerById(custId);
      let comparison;
      if (args.scenarioId) {
        comparison = await relationshipValueService.compareScenario(custId, args.scenarioId, ctx.user as any, ctx.requestId);
      } else {
        comparison = await relationshipValueService.getCurrentProfile(custId, ctx.user as any, ctx.requestId);
      }

      const dim = comparison.dimensions.find(
        (d) => d.dimension === args.dimension || d.label.toLowerCase() === String(args.dimension || '').toLowerCase()
      );
      const explanationText = dim
        ? `Dimension ${dim.label} is currently ${dim.currentValueFormatted} (${dim.status}) based on ${dim.sourceEngine}. ${dim.explanation}`
        : comparison.explanation;

      sources.push({
        type: 'CUSTOMER',
        id: String(custId),
        label: `Scenario Explanation · ${args.dimension || 'Profile'}`,
        link: `/customers?id=${custId}&tab=value`,
      });
      return {
        data: {
          classification: {
            type: 'INTERPRETATION',
            facts: [
              `Dimension: ${dim?.label || args.dimension || 'CORE Score'}`,
              `Observed Value: ${dim?.currentValueFormatted || 'Evaluated'}`,
              `Source Engine: ${dim?.sourceEngine || 'CORE Score Engine'}`,
            ],
            interpretations: [explanationText],
            limitations: comparison.limitations,
          },
          explanation: explanationText,
          supportingSignals: comparison.supportingSignals,
          dimensions: comparison.dimensions.map((d) => ({
            dimension: d.label,
            current: d.currentValue,
            simulated: d.scenarioValue,
            change: d.change,
            changeType: d.changeType,
            engine: d.sourceEngine,
          })),
          limitations: comparison.limitations,
        },
        sources,
      };
    }

    case 'getCustomerJourneys': {
      const cust = await customerService.getCustomerById(args.customerId);
      const journeys = await journeyService.listJourneys(
        { customerId: cust.id, status: args.status },
        ctx.user as any,
        ctx.requestId
      );

      for (const j of journeys) {
        sources.push({
          type: 'JOURNEY',
          id: j.journeyCode,
          label: `Journey · ${j.name} (${j.status})`,
          link: `/journeys?id=${j.id}`,
        });
      }

      const activeCount = journeys.filter((j) => j.status === 'IN_PROGRESS' || j.status === 'BLOCKED').length;
      const blockedCount = journeys.filter((j) => j.status === 'BLOCKED').length;

      return {
        data: {
          classification: {
            type: 'FACT',
            facts: journeys.map(
              (j) =>
                `Journey ${j.journeyCode}: ${j.name} | Status: ${j.status} | Priority: ${j.priority} | Progress: ${j.progressPercentage}% | SLA: ${j.slaStatus} | Owner: ${j.ownerRole}`
            ),
            evidence: journeys
              .filter((j) => j.blockerReason)
              .map((j) => `Blocker in ${j.journeyCode}: ${j.blockerReason}`),
            interpretations: [
              `Customer ${cust.name} has ${journeys.length} total journeys (${activeCount} active, ${blockedCount} blocked).`,
              blockedCount > 0 ? `Urgent attention required: ${blockedCount} journeys are currently blocked.` : `All active journeys are progressing normally.`,
            ],
            recommendations: blockedCount > 0
              ? ['Investigate blocked journey steps using getJourneyBlockers and resolve prerequisite dependencies.']
              : ['Continue scheduled lifecycle reviews and monitor upcoming milestone SLAs.'],
          },
          journeys,
          summary: {
            total: journeys.length,
            active: activeCount,
            blocked: blockedCount,
            completed: journeys.filter((j) => j.status === 'COMPLETED').length,
          },
        },
        sources,
      };
    }

    case 'getJourney': {
      const journey = await journeyService.getJourney(args.journeyId, ctx.user as any, ctx.requestId);
      const steps = journey.steps || [];
      const progress = journey.progress || ({} as any);

      sources.push({
        type: 'JOURNEY',
        id: journey.journeyCode || journey.journeyId,
        label: `Journey · ${journey.name} (${journey.status})`,
        link: `/journeys?id=${journey.id}`,
      });

      return {
        data: {
          classification: {
            type: 'FACT',
            facts: [
              `Journey Code: ${journey.journeyCode || journey.journeyId}`,
              `Template: ${journey.journeyType || journey.name}`,
              `Status: ${journey.status}`,
              `Priority: ${journey.priority}`,
              `SLA Status: ${journey.slaStatus}`,
              `Assigned Owner: ${journey.ownerName || journey.ownerRole}`,
              `Progress: ${progress.completedSteps || 0}/${progress.totalSteps || 0} steps (${progress.percentage || progress.progressPercentage || 0}%)`,
              `Target Completion: ${journey.targetCompletionAt || 'Not set'}`,
            ],
            evidence: steps
              .filter((s) => s.status === 'COMPLETED')
              .map((s) => `Step '${s.name}' completed on ${s.completedAt}`),
            interpretations: [
              journey.status === 'BLOCKED'
                ? `Journey is currently blocked: ${journey.blockedReason || 'Unresolved dependency'}`
                : `Journey is ${journey.status.toLowerCase()} with SLA health ${journey.slaStatus}.`,
            ],
            recommendations: steps
              .filter((s) => s.status === 'READY')
              .map((s) => `Action ready: Step '${s.name}' is unblocked and ready for execution by ${s.assignedRole}.`),
          },
          journey,
          steps,
          progress,
        },
        sources,
      };
    }

    case 'getJourneyTimeline': {
      const result = await journeyService.getJourney(args.journeyId, ctx.user as any, ctx.requestId);
      const timeline = result.timeline || [];
      sources.push({
        type: 'JOURNEY',
        id: result.journeyCode || result.journeyId,
        label: `Journey Timeline · ${result.journeyCode || result.journeyId}`,
        link: `/journeys?id=${result.id}`,
      });

      return {
        data: {
          classification: {
            type: 'FACT',
            facts: timeline.map(
              (t) => `[${t.timestamp}] ${t.title}: ${t.description} (Actor: ${t.actorName || 'System'})`
            ),
            evidence: timeline.map((t) => `Event ${t.id} type: ${t.eventType}`),
          },
          journeyCode: result.journeyCode || result.journeyId,
          journeyName: result.name,
          timeline,
        },
        sources,
      };
    }

    case 'getJourneySteps': {
      const result = await journeyService.getJourney(args.journeyId, ctx.user as any, ctx.requestId);
      const steps = result.steps || [];
      sources.push({
        type: 'JOURNEY',
        id: result.journeyCode || result.journeyId,
        label: `Journey Steps · ${result.journeyCode || result.journeyId}`,
        link: `/journeys?id=${result.id}`,
      });

      return {
        data: {
          classification: {
            type: 'FACT',
            facts: steps.map(
              (s) =>
                `#${s.stepOrder || s.stepNumber} ${s.name} [${s.stepType}] — Status: ${s.status}, SLA: ${s.slaStatus}, Assignee: ${s.assignedRole}`
            ),
            evidence: steps
              .filter((s) => s.evidenceVerified)
              .map((s) => `Evidence verified for step ${s.stepKey}: ${JSON.stringify(s.completionEvidence || {})}`),
            recommendations: steps
              .filter((s) => s.status === 'READY')
              .map((s) => `Step ready for processing: ${s.name} (${s.assignedRole})`),
          },
          journeyCode: result.journeyCode || result.journeyId,
          steps,
        },
        sources,
      };
    }

    case 'getJourneyBlockers': {
      const cust = await customerService.getCustomerById(args.customerId);
      const journeys = await journeyService.listJourneys({ customerId: cust.id }, ctx.user as any, ctx.requestId);
      const targetJourneys = args.journeyId
        ? journeys.filter((j) => String(j.id) === String(args.journeyId) || j.journeyCode === String(args.journeyId))
        : journeys;

      const blockers: any[] = [];
      for (const j of targetJourneys) {
        const full = await journeyService.getJourney(j.id, ctx.user as any, ctx.requestId);
        for (const s of full.steps) {
          if (s.status === 'BLOCKED' || s.slaStatus === 'BREACHED') {
            blockers.push({
              journeyId: j.id,
              journeyCode: j.journeyCode,
              journeyName: j.name,
              stepId: s.id,
              stepKey: s.stepKey,
              stepName: s.name,
              status: s.status,
              slaStatus: s.slaStatus,
              blockerReason: s.blockerReason || (s.slaStatus === 'BREACHED' ? 'SLA target breached' : 'Dependency incomplete'),
              assignedRole: s.assignedRole,
              assignedUserName: s.assignedUserName,
              blockedAt: s.updatedAt,
            });
          }
        }
      }

      for (const b of blockers) {
        sources.push({
          type: 'JOURNEY',
          id: b.journeyCode,
          label: `Blocker · ${b.stepName} (${b.journeyCode})`,
          link: `/journeys?id=${b.journeyId}`,
        });
      }

      return {
        data: {
          classification: {
            type: 'INTERPRETATION',
            facts: blockers.map((b) => `Blocked Step: ${b.stepName} in ${b.journeyCode} | Reason: ${b.blockerReason}`),
            evidence: blockers.map((b) => `Step ID: ${b.stepId}, Status: ${b.status}, SLA: ${b.slaStatus}`),
            interpretations: [
              blockers.length === 0
                ? 'No active journey blockers or SLA breaches detected for this customer.'
                : `Detected ${blockers.length} operational blockers requiring intervention.`,
            ],
            recommendations: blockers.map((b) => `Resolve blocker on '${b.stepName}' assigned to ${b.assignedRole}: ${b.blockerReason}`),
          },
          blockers,
          totalBlockers: blockers.length,
        },
        sources,
      };
    }

    case 'getJourneyEvidence': {
      const result = await journeyService.getJourney(args.journeyId, ctx.user as any, ctx.requestId);
      let targetSteps = result.steps || [];
      if (args.stepId) {
        targetSteps = targetSteps.filter(
          (s) => String(s.id) === String(args.stepId) || s.stepKey === String(args.stepId)
        );
      }

      sources.push({
        type: 'JOURNEY',
        id: result.journeyCode || result.journeyId,
        label: `Journey Evidence · ${result.journeyCode || result.journeyId}`,
        link: `/journeys?id=${result.id}`,
      });

      const evidenceList = targetSteps.map((s) => ({
        stepId: s.id,
        stepKey: s.stepKey,
        stepName: s.name,
        stepType: s.stepType,
        evidenceType: (s as any).evidenceType || s.completionEvidence?.evidenceType || null,
        evidenceVerified: s.evidenceVerified,
        verifiedAt: (s as any).verifiedAt || s.completionEvidence?.verifiedAt || s.completedAt || null,
        completionEvidence: s.completionEvidence,
        status: s.status,
      }));

      return {
        data: {
          classification: {
            type: 'EVIDENCE',
            facts: evidenceList.map(
              (e) =>
                `Step ${e.stepName}: Evidence Verified = ${e.evidenceVerified ? 'YES' : 'NO'}, Type = ${e.evidenceType || 'N/A'}`
            ),
            evidence: evidenceList
              .filter((e) => e.evidenceVerified)
              .map((e) => `Verified Evidence Payload: ${JSON.stringify(e.completionEvidence)}`),
            limitations: [
              'Evidence records are validated against authoritative COREvia tables (documents, tasks, cases, reviews).',
            ],
          },
          journeyCode: result.journeyCode || result.journeyId,
          evidence: evidenceList,
        },
        sources,
      };
    }

    case 'getJourneyHistory': {
      const cust = await customerService.getCustomerById(args.customerId);
      const journeys = await journeyService.listJourneys({ customerId: cust.id }, ctx.user as any, ctx.requestId);
      const limit = Number(args.limit) || 10;
      const history = journeys
        .filter((j) => j.status === 'COMPLETED' || j.status === 'CANCELLED')
        .slice(0, limit);

      for (const h of history) {
        sources.push({
          type: 'JOURNEY',
          id: h.journeyCode,
          label: `Historical Journey · ${h.name} (${h.status})`,
          link: `/journeys?id=${h.id}`,
        });
      }

      return {
        data: {
          classification: {
            type: 'FACT',
            facts: history.map(
              (h) =>
                `Journey ${h.journeyCode || h.journeyId}: ${h.name} ended with status ${h.status} on ${h.completedAt || h.targetCompletionAt || 'N/A'}`
            ),
            evidence: history.map((h) => `Journey ID ${h.id} started ${h.startedAt || 'N/A'}`),
          },
          customerId: cust.id,
          customerCode: cust.customerCode,
          history,
          totalHistorical: history.length,
        },
        sources,
      };
    }

    // ==========================================
    // PHASE 34: HOUSEHOLD & BUSINESS GROUP 360 TOOLS
    // ==========================================
    case 'getRelationshipGroups': {
      const groups = await groupService.listGroups(
        {
          search: args.search,
          groupType: args.groupType,
          limit: Number(args.limit) || 10,
        },
        ctx.user as any,
        ctx.requestId
      );

      for (const g of groups) {
        sources.push({
          type: 'GROUP',
          id: g.groupId,
          label: `${g.displayName} (${g.groupType})`,
          link: `/group/${g.groupId}`,
        });
      }

      return {
        data: {
          classification: {
            type: 'FACT',
            facts: groups.map(
              (g) =>
                `Group ${g.groupId}: ${g.displayName} (${g.groupType}) · Status: ${g.status} · Members: ${g.members?.length || 0}`
            ),
            evidence: groups.map((g) => `Group ID ${g.groupId} created ${g.createdAt}`),
          },
          groups,
          count: groups.length,
        },
        sources,
      };
    }

    case 'getRelationshipGroup': {
      const group = await groupService.getGroup(args.groupId, ctx.user as any, ctx.requestId);
      sources.push({
        type: 'GROUP',
        id: group.groupId,
        label: `${group.displayName} (${group.groupType})`,
        link: `/group/${group.groupId}`,
      });

      return {
        data: {
          classification: {
            type: 'FACT',
            facts: [
              `Group ${group.groupId}: ${group.name} (${group.groupType})`,
              `Status: ${group.status}, Description: ${group.description || 'N/A'}`,
              `Total Members: ${group.members?.length || 0}`,
            ],
            evidence: [`Group created at ${group.createdAt}, updated at ${group.updatedAt}`],
          },
          group,
        },
        sources,
      };
    }

    case 'getGroupMembers': {
      const group = await groupService.getGroup(args.groupId, ctx.user as any, ctx.requestId);
      const members = await groupService.getGroupMembers(args.groupId, ctx.user as any, ctx.requestId);
      sources.push({
        type: 'GROUP',
        id: group.groupId,
        label: `${group.displayName} Members`,
        link: `/group/${group.groupId}`,
      });

      return {
        data: {
          classification: {
            type: 'FACT',
            facts: members.map(
              (m) =>
                `Member ${m.name || m.entityId}: Role: ${m.role}, Type: ${m.relationshipType}, Authorized: ${m.isAuthorized ? 'YES' : 'NO (Protected)'}`
            ),
            evidence: members.map(
              (m) => `Entity ${m.entityType}:${m.entityId} primary: ${m.isPrimary ? 'YES' : 'NO'}`
            ),
            limitations: [
              'Members with restricted permissions have masked financial and scoring details.',
            ],
          },
          groupId: group.groupId,
          members,
          count: members.length,
        },
        sources,
      };
    }

    case 'getGroupProfile': {
      const group = await groupService.getGroup(args.groupId, ctx.user as any, ctx.requestId);
      const profile = await groupService.getGroupProfile(args.groupId, ctx.user as any, ctx.requestId);
      sources.push({
        type: 'GROUP',
        id: group.groupId,
        label: `${group.displayName} Relationship Profile`,
        link: `/group/${group.groupId}`,
      });

      return {
        data: {
          classification: {
            type: 'INTERPRETATION',
            facts: [
              `Group Relationship Value: ${profile.relationshipValue.formattedValue}`,
              `CORE Score Distribution: Min ${profile.coreProfile.minScore ?? 'N/A'}, Max ${profile.coreProfile.maxScore ?? 'N/A'}, Avg ${profile.coreProfile.averageScore ?? 'N/A'}`,
              `Unique Products: ${profile.productDepth.uniqueProductsCount}, Total Product Relations: ${profile.productDepth.totalProductRelationships}`,
              `Open Service Cases: ${profile.serviceHealth.openCases}, Critical: ${profile.serviceHealth.criticalCases}`,
              `Open Opportunities: ${profile.opportunities.openCount}, Total Value: ${profile.opportunities.formattedPipelineValue}`,
              `Active Journeys: ${profile.activeJourneys.activeCount}, Blocked: ${profile.activeJourneys.blockedCount}`,
            ],
            evidence: [
              `Aggregated across authorized group members (only authorized member values included).`,
            ],
            limitations: [
              'CORE Score is presented as distribution/range without fabricating a synthetic single group score.',
              'Unauthorized member records are excluded from financial sums.',
            ],
          },
          groupId: group.groupId,
          profile,
        },
        sources,
      };
    }

    case 'getGroupTimeline': {
      const group = await groupService.getGroup(args.groupId, ctx.user as any, ctx.requestId);
      const limit = Number(args.limit) || 20;
      const timeline = await groupService.getGroupTimeline(args.groupId, limit, ctx.user as any, ctx.requestId);
      sources.push({
        type: 'GROUP',
        id: group.groupId,
        label: `${group.displayName} Timeline`,
        link: `/group/${group.groupId}`,
      });

      return {
        data: {
          classification: {
            type: 'FACT',
            facts: timeline.map(
              (t) =>
                `[${new Date(t.timestamp).toLocaleDateString()}] ${t.entity} (${t.entityId}): ${t.title || t.interactionType}`
            ),
            evidence: timeline.map((t) => `Event source: ${t.source} ID: ${t.id}`),
          },
          groupId: group.groupId,
          timeline,
          count: timeline.length,
        },
        sources,
      };
    }

    case 'getGroupSignals': {
      const group = await groupService.getGroup(args.groupId, ctx.user as any, ctx.requestId);
      const signals = await groupService.getGroupSignals(args.groupId, ctx.user as any, ctx.requestId);
      sources.push({
        type: 'GROUP',
        id: group.groupId,
        label: `${group.displayName} Signals`,
        link: `/group/${group.groupId}`,
      });

      return {
        data: {
          classification: {
            type: 'INTERPRETATION',
            facts: signals.map(
              (s: any) =>
                `Signal ${s.signalCode || s.id}: ${s.title || s.type} (${s.severity || s.priority}) for ${s.entityName || s.customerName || 'Group Member'}`
            ),
            evidence: signals.map((s: any) => `Signal origin: ${s.sourceEngine || 'SignalCenter'}`),
          },
          groupId: group.groupId,
          signals,
          count: signals.length,
        },
        sources,
      };
    }

    case 'getGroupJourneys': {
      const group = await groupService.getGroup(args.groupId, ctx.user as any, ctx.requestId);
      const journeys = await groupService.getGroupJourneys(args.groupId, ctx.user as any, ctx.requestId);
      sources.push({
        type: 'GROUP',
        id: group.groupId,
        label: `${group.displayName} Journeys`,
        link: `/group/${group.groupId}`,
      });

      return {
        data: {
          classification: {
            type: 'FACT',
            facts: journeys.map(
              (j: any) =>
                `Journey ${j.journeyCode || j.journeyId}: ${j.name} (${j.status}) for ${j.customerName || j.customerCode} · SLA: ${j.slaStatus}`
            ),
            evidence: journeys.map((j: any) => `Journey ID ${j.id} started ${j.startedAt}`),
          },
          groupId: group.groupId,
          journeys,
          count: journeys.length,
        },
        sources,
      };
    }

    case 'getGroupOpportunities': {
      const group = await groupService.getGroup(args.groupId, ctx.user as any, ctx.requestId);
      const opportunities = await groupService.getGroupOpportunities(args.groupId, ctx.user as any, ctx.requestId);
      sources.push({
        type: 'GROUP',
        id: group.groupId,
        label: `${group.displayName} Opportunities`,
        link: `/group/${group.groupId}`,
      });

      return {
        data: {
          classification: {
            type: 'FACT',
            facts: opportunities.map(
              (o: any) =>
                `Opportunity ${o.opportunityCode || o.id}: ${o.title} · Stage: ${o.stage} · Value: ₹${o.estimatedValue || '0'} · Owner: ${o.customerName || o.memberId}`
            ),
            evidence: opportunities.map((o: any) => `Opportunity ID ${o.id}`),
          },
          groupId: group.groupId,
          opportunities,
          count: opportunities.length,
        },
        sources,
      };
    }

    case 'getGroupServiceCases': {
      const group = await groupService.getGroup(args.groupId, ctx.user as any, ctx.requestId);
      const serviceCases = await groupService.getGroupServiceCases(args.groupId, ctx.user as any, ctx.requestId);
      sources.push({
        type: 'GROUP',
        id: group.groupId,
        label: `${group.displayName} Service Desk Cases`,
        link: `/group/${group.groupId}`,
      });

      return {
        data: {
          classification: {
            type: 'FACT',
            facts: serviceCases.map(
              (c: any) =>
                `Case ${c.caseNumber || c.id}: ${c.subject || c.title} · Status: ${c.status} · Priority: ${c.priority} · Member: ${c.customerName || c.memberId}`
            ),
            evidence: serviceCases.map((c: any) => `Case ID ${c.id} created ${c.createdAt}`),
          },
          groupId: group.groupId,
          serviceCases,
          count: serviceCases.length,
        },
        sources,
      };
    }

    case 'getGroupEvidence': {
      const group = await groupService.getGroup(args.groupId, ctx.user as any, ctx.requestId);
      const evidenceData = await groupService.getGroupEvidence(args.groupId, ctx.user as any, ctx.requestId);
      const evidenceRecords: any[] = (evidenceData as any).evidenceRecords || (Array.isArray(evidenceData) ? evidenceData : []);
      sources.push({
        type: 'GROUP',
        id: group.groupId,
        label: `${group.displayName} Evidence`,
        link: `/group/${group.groupId}`,
      });

      return {
        data: {
          classification: {
            type: 'EVIDENCE',
            facts: evidenceRecords.map(
              (e: any) =>
                `Evidence ${e.relationshipType}: ${e.source} -> ${e.target} · Provenance: ${e.provenanceType || 'DIRECT_RECORD'}`
            ),
            evidence: evidenceRecords.map((e: any) => `Graph Edge ID ${e.id} provenanceId: ${e.provenanceId || 'N/A'}`),
            limitations: [
              'Group relationship evidence links directly to verified Phase 28 relationship graph edges and official KYC records.',
            ],
          },
          groupId: group.groupId,
          evidence: evidenceRecords,
          count: evidenceRecords.length,
        },
        sources,
      };
    }

    // ==========================================
    // PHASE 35: TRUST & GOVERNANCE TOOL HANDLERS
    // ==========================================
    case 'getGovernanceOverview': {
      const overview = await governanceService.getOverview(ctx.user as any);
      sources.push({
        type: 'GOVERNANCE',
        id: 'GOV-OVERVIEW',
        label: 'Trust & Governance Center',
        link: '/governance',
      });
      return {
        data: {
          classification: {
            type: 'GOVERNANCE_OVERVIEW',
            facts: [
              `System Status: ${overview.systemStatus} (${overview.statusReason})`,
              `Audit Activity: ${overview.auditActivity.totalEvents} events (${overview.auditActivity.recentEvents24h} in last 24h)`,
              `AI Activity: ${overview.aiActivity.copilotSessions} Copilot sessions, ${overview.aiActivity.agentPlans} Agent plans`,
              `Human Approvals Pending: ${overview.humanApprovals.pendingCount}`,
              `Security Anomalies: ${overview.security.authorizationFailures} authorization failures, ${overview.security.criticalEvents} critical events`,
              `Governance Exceptions: ${overview.governanceExceptions.open} open (${overview.governanceExceptions.highCritical} high/critical)`,
            ],
            limitations: ['Synthetic environment telemetry. Production metrics require institution-specific deployment.'],
          },
          overview,
        },
        sources,
      };
    }

    case 'getAuditEvents': {
      const auditData = await governanceService.getAuditExplorer(
        {
          event: args.event,
          module: args.module,
          limit: args.limit || 10,
        },
        ctx.user as any
      );
      sources.push({
        type: 'GOVERNANCE',
        id: 'GOV-AUDIT',
        label: 'Audit Explorer',
        link: '/governance?tab=audit',
      });
      return {
        data: {
          classification: {
            type: 'AUDIT_TRAIL',
            facts: [
              `Total Audit Records: ${auditData.total}`,
              `Tamper-Evident Status: ${auditData.chainIntegrity.chainStatus} (${auditData.chainIntegrity.recordsChecked} checked)`,
            ],
            limitations: ['Append-only cryptographic record hashes prevent retroactive modification.'],
          },
          auditData,
        },
        sources,
      };
    }

    case 'getAIGovernance': {
      const aiGov = await governanceService.getAIGovernance(ctx.user as any);
      sources.push({
        type: 'GOVERNANCE',
        id: 'GOV-AI',
        label: 'AI Governance',
        link: '/governance?tab=ai',
      });
      return {
        data: {
          classification: {
            type: 'AI_GOVERNANCE',
            facts: [
              `Configured Model: ${aiGov.modelConfig.provider} ${aiGov.modelConfig.model}`,
              `Model Availability: ${aiGov.modelConfig.status} (Key: ${aiGov.modelConfig.keyConfigured ? 'CONFIGURED' : 'MISSING'})`,
              `Copilot Sessions: ${aiGov.copilotSessions} | Deterministic: ${aiGov.deterministicResponses} | AI Generated: ${aiGov.aiGeneratedResponses}`,
              `Fallback Activations: ${aiGov.aiFallbacks.length}`,
            ],
            limitations: ['Zero API key exposure enforced. Real credentials never transmitted.'],
          },
          aiGov,
        },
        sources,
      };
    }

    case 'getAgentGovernance': {
      const agentGov = await governanceService.getAgentGovernance(ctx.user as any);
      sources.push({
        type: 'GOVERNANCE',
        id: 'GOV-AGENT',
        label: 'Agent Governance',
        link: '/governance?tab=agents',
      });
      return {
        data: {
          classification: {
            type: 'AGENT_GOVERNANCE',
            facts: [
              `Plans Created: ${agentGov.plansCreated} | Approved: ${agentGov.approved} | Completed: ${agentGov.completed}`,
              `Rejected: ${agentGov.rejected} | Failed: ${agentGov.failed} | Expired: ${agentGov.expired}`,
            ],
            limitations: ['All agent plans operate strictly under bounded Maker-Checker human approval.'],
          },
          agentGov,
        },
        sources,
      };
    }

    case 'getSecurityEvents': {
      const secGov = await governanceService.getSecurityGovernance(ctx.user as any);
      sources.push({
        type: 'GOVERNANCE',
        id: 'GOV-SECURITY',
        label: 'Security Center',
        link: '/governance?tab=security',
      });
      return {
        data: {
          classification: {
            type: 'SECURITY_GOVERNANCE',
            facts: [
              `Authorization Failures: ${secGov.authorizationFailures} | Failed Logins: ${secGov.failedLogins}`,
              `Rate Limit Events: ${secGov.rateLimitEvents} | Active Sessions: ${secGov.activeSessionsCount}`,
            ],
            limitations: ['Monitored under neutral terminology without biased threat profiling.'],
          },
          secGov,
        },
        sources,
      };
    }

    case 'getAccessEvents': {
      const accessGov = await governanceService.getAccessGovernance(ctx.user as any);
      sources.push({
        type: 'GOVERNANCE',
        id: 'GOV-ACCESS',
        label: 'Access Governance',
        link: '/governance?tab=access',
      });
      return {
        data: {
          classification: {
            type: 'ACCESS_GOVERNANCE',
            facts: [
              `Total Access Events 24h: ${accessGov.totalEvents}`,
              `Logins: ${accessGov.loginEvents} | Logouts: ${accessGov.logoutEvents}`,
              `Authorization Failures: ${accessGov.authorizationFailures}`,
            ],
            limitations: ['Access logged per resource authorization boundaries.'],
          },
          accessGov,
        },
        sources,
      };
    }

    case 'getGovernanceExceptions': {
      const exceptions = await governanceService.getExceptions(
        {
          status: args.status,
          severity: args.severity,
          limit: 10,
        },
        ctx.user as any
      );
      sources.push({
        type: 'GOVERNANCE',
        id: 'GOV-EXCEPTIONS',
        label: 'Governance Exceptions',
        link: '/governance?tab=exceptions',
      });
      return {
        data: {
          classification: {
            type: 'GOVERNANCE_EXCEPTIONS',
            facts: [
              `Open Exceptions Total: ${exceptions.total}`,
              `Items Retrieved: ${exceptions.items.length}`,
            ],
            limitations: ['Human investigators retain full authority to acknowledge, assign, resolve, or dismiss.'],
          },
          exceptions,
        },
        sources,
      };
    }

    case 'getSystemHealth': {
      const health = await governanceService.getSystemHealth(ctx.user as any);
      sources.push({
        type: 'GOVERNANCE',
        id: 'GOV-HEALTH',
        label: 'System Health',
        link: '/governance?tab=health',
      });
      return {
        data: {
          classification: {
            type: 'SYSTEM_HEALTH',
            facts: [
              `Overall Status: ${health.overall}`,
              `PostgreSQL Database: ${health.services.database.status} (latency: ${health.services.database.latencyMs}ms)`,
              `API Gateway: ${health.services.api.status}`,
              `Gemini Engine: ${health.services.gemini.status}`,
            ],
            limitations: ['Evaluated via real database pings and environment checks.'],
          },
          health,
        },
        sources,
      };
    }

    // ==========================================
    // PHASE 36: BANKING OPERATIONS WORKSPACE EXECUTION CASES
    // ==========================================
    case 'getMyOperationalApprovals': {
      const approvals = await operationsService.getApprovals(
        {
          status: args.status,
          priority: args.priority,
          limit: 15,
        },
        ctx.user as any
      );
      sources.push({
        type: 'OPERATIONS',
        id: 'OPS-APPROVALS',
        label: 'Operational Approvals Queue',
        link: '/operations?tab=approvals',
      });
      return {
        data: {
          classification: {
            type: 'DETERMINISTIC',
            facts: [
              `Total Retrieved: ${approvals.length}`,
              `Awaiting Checker Count: ${approvals.filter((a) => a.status === 'PENDING').length}`,
            ],
            limitations: ['Dual control strictly enforced. Maker cannot self-approve.'],
          },
          approvals,
        },
        sources,
      };
    }

    case 'getOperationalExceptions': {
      const exceptions = await operationsService.getExceptions(
        {
          category: args.category,
          severity: args.severity,
          status: args.status,
          limit: 20,
        },
        ctx.user as any
      );
      sources.push({
        type: 'OPERATIONS',
        id: 'OPS-EXCEPTIONS',
        label: 'Operational Exceptions',
        link: '/operations?tab=exceptions',
      });
      return {
        data: {
          classification: {
            type: 'DETERMINISTIC',
            facts: [
              `Total Exceptions Retrieved: ${exceptions.length}`,
              `High/Critical Severity: ${exceptions.filter((e) => e.severity === 'HIGH' || e.severity === 'CRITICAL').length}`,
            ],
            limitations: ['Exceptions require authorized officer resolution with audit trail.'],
          },
          exceptions,
        },
        sources,
      };
    }

    case 'getOperationalException': {
      const ex = await operationsService.getExceptionById(args.exceptionId, ctx.user as any);
      sources.push({
        type: 'OPERATIONS',
        id: ex.exceptionId,
        label: `Exception ${ex.exceptionId}`,
        link: `/operations?tab=exceptions&id=${ex.exceptionId}`,
      });
      return {
        data: {
          classification: {
            type: 'DETERMINISTIC',
            facts: [
              `Exception ID: ${ex.exceptionId}`,
              `Category: ${ex.category} | Severity: ${ex.severity}`,
              `Status: ${ex.status}`,
              `Customer: ${ex.customerName || 'Institutional'}`,
            ],
            limitations: ['Read-only inspection. Mutations require manual dual control.'],
          },
          exception: ex,
        },
        sources,
      };
    }

    case 'getReconciliationRecords': {
      const records = await operationsService.getReconciliationRecords(
        {
          status: args.status,
          reconciliationType: args.reconciliationType,
          limit: 15,
        },
        ctx.user as any
      );
      sources.push({
        type: 'OPERATIONS',
        id: 'OPS-RECONCILIATION',
        label: 'Reconciliation Workspace',
        link: '/operations?tab=reconciliation',
      });
      return {
        data: {
          classification: {
            type: 'DETERMINISTIC',
            facts: [
              `Total Records: ${records.length}`,
              `Unresolved Mismatches: ${records.filter((r) => r.status === 'MISMATCH').length}`,
            ],
            limitations: ['Synthetic reconciliation data for testing and operational simulation.'],
          },
          records,
        },
        sources,
      };
    }

    case 'getOperationalTasks': {
      const tasksList = await operationsService.getOperationalTasks(ctx.user as any);
      sources.push({
        type: 'OPERATIONS',
        id: 'OPS-TASKS',
        label: 'Operational Tasks',
        link: '/operations?tab=tasks',
      });
      return {
        data: {
          classification: {
            type: 'DETERMINISTIC',
            facts: [`Pending Operational Tasks: ${tasksList.length}`],
            limitations: ['Fetched directly from Core Banking task engine.'],
          },
          tasks: tasksList,
        },
        sources,
      };
    }

    case 'getOperationalEvents': {
      const events = await operationsService.getOperationalEvents(
        {
          severity: args.severity,
          limit: args.limit || 20,
        },
        ctx.user as any
      );
      sources.push({
        type: 'OPERATIONS',
        id: 'OPS-EVENTS',
        label: 'Operational Events Stream',
        link: '/operations?tab=events',
      });
      return {
        data: {
          classification: {
            type: 'DETERMINISTIC',
            facts: [`Operational Events Retrieved: ${events.length}`],
            limitations: ['Sensitive account numbers and customer identifiers masked.'],
          },
          events,
        },
        sources,
      };
    }

    // ==========================================
    // PHASE 37: ADVANCED PORTFOLIO INTELLIGENCE
    // ==========================================
    case 'getPortfolioOverview': {
      const overview = await portfolioIntelligenceService.getPortfolioOverview(ctx.user as any, args);
      sources.push({
        type: 'PORTFOLIO_INTELLIGENCE' as any,
        id: 'PORT-OVERVIEW',
        label: 'Portfolio Intelligence Overview',
        link: '/portfolio-intelligence',
      });
      return {
        data: {
          classification: {
            type: 'DETERMINISTIC',
            facts: [
              `Authorized Customers: ${overview.authorizedCustomers}`,
              `Total Relationship Value: ₹${(overview.totalRelationshipValue / 10000000).toFixed(2)} Cr`,
              `Average CORE Score: ${overview.averageCoreScore}`,
              `Open Pipeline Value: ₹${(overview.opportunityPipelineValue / 10000000).toFixed(2)} Cr`,
              `Active Signals: ${overview.activeSignals}`,
            ],
            limitations: ['Aggregated strictly from authorized customer records. Non-predictive.'],
          },
          overview,
        },
        sources,
      };
    }

    case 'getPortfolioHealth': {
      const health = await portfolioIntelligenceService.getRelationshipHealthDistribution(ctx.user as any, args);
      sources.push({
        type: 'PORTFOLIO_INTELLIGENCE' as any,
        id: 'PORT-HEALTH',
        label: 'Relationship Health Distribution',
        link: '/portfolio-intelligence',
      });
      return {
        data: {
          classification: {
            type: 'DETERMINISTIC',
            facts: [`Health categories calculated from canonical CORE Scores and momentum.`],
            limitations: ['Descriptive health categorization; not a predictive churn or default model.'],
          },
          health,
        },
        sources,
      };
    }

    case 'getPortfolioCoreScoreDistribution': {
      const coreScore = await portfolioIntelligenceService.getCoreScoreAnalysis(ctx.user as any, args);
      sources.push({
        type: 'PORTFOLIO_INTELLIGENCE' as any,
        id: 'PORT-CORE',
        label: 'CORE Score Distribution Analysis',
        link: '/portfolio-intelligence',
      });
      return {
        data: {
          classification: {
            type: 'DETERMINISTIC',
            facts: [
              `Average Score: ${coreScore.averageScore}`,
              `Score Range: ${coreScore.minScore} - ${coreScore.maxScore}`,
            ],
            limitations: ['Uses existing deterministic CORE Score engine components.'],
          },
          coreScore,
        },
        sources,
      };
    }

    case 'getPortfolioRelationshipValue': {
      const valueAnalysis = await portfolioIntelligenceService.getRelationshipValueAnalysis(ctx.user as any, args);
      sources.push({
        type: 'PORTFOLIO_INTELLIGENCE' as any,
        id: 'PORT-VAL',
        label: 'Relationship Value Analysis',
        link: '/portfolio-intelligence',
      });
      return {
        data: {
          classification: {
            type: 'DETERMINISTIC',
            facts: [
              `Total Portfolio Value: ₹${(valueAnalysis.totalValue / 10000000).toFixed(2)} Cr`,
              `Top 5 Concentration: ${valueAnalysis.top5ConcentrationPct}%`,
            ],
            limitations: ['Based on current deposit balances, credit facilities, and active investment accounts.'],
          },
          valueAnalysis,
        },
        sources,
      };
    }

    case 'getPortfolioProductPenetration': {
      const penetration = await portfolioIntelligenceService.getProductPenetration(ctx.user as any, args);
      sources.push({
        type: 'PORTFOLIO_INTELLIGENCE' as any,
        id: 'PORT-PROD',
        label: 'Product Penetration & Depth',
        link: '/portfolio-intelligence',
      });
      return {
        data: {
          classification: {
            type: 'DETERMINISTIC',
            facts: [
              `Product Types Tracked: ${penetration.products.length}`,
              `Shallow Depth Customers: ${penetration.shallowDepthCustomers.length}`,
            ],
            limitations: ['Observed product holdings only.'],
          },
          penetration,
        },
        sources,
      };
    }

    case 'getPortfolioEngagement': {
      const engagement = await portfolioIntelligenceService.getEngagementIntelligence(ctx.user as any, args);
      sources.push({
        type: 'PORTFOLIO_INTELLIGENCE' as any,
        id: 'PORT-ENG',
        label: 'Portfolio Engagement Metrics',
        link: '/portfolio-intelligence',
      });
      return {
        data: {
          classification: {
            type: 'DETERMINISTIC',
            facts: [
              `Total Interactions: ${engagement.totalInteractions}`,
              `Inactive Customers (>45D): ${engagement.inactiveCustomers.length}`,
            ],
            limitations: ['Logged customer touchpoints and meetings only.'],
          },
          engagement,
        },
        sources,
      };
    }

    case 'getPortfolioServiceHealth': {
      const serviceQuality = await portfolioIntelligenceService.getServiceQuality(ctx.user as any, args);
      sources.push({
        type: 'PORTFOLIO_INTELLIGENCE' as any,
        id: 'PORT-SRV',
        label: 'Portfolio Service Health',
        link: '/portfolio-intelligence',
      });
      return {
        data: {
          classification: {
            type: 'DETERMINISTIC',
            facts: [
              `Open Service Cases: ${serviceQuality.openCases}`,
              `SLA Breached Cases: ${serviceQuality.slaBreachedCount}`,
            ],
            limitations: ['Service cases managed via banking service desk.'],
          },
          serviceQuality,
        },
        sources,
      };
    }

    case 'getPortfolioPipeline': {
      const pipeline = await portfolioIntelligenceService.getOpportunityPortfolio(ctx.user as any, args);
      sources.push({
        type: 'PORTFOLIO_INTELLIGENCE' as any,
        id: 'PORT-OPP',
        label: 'Opportunity Pipeline Portfolio',
        link: '/portfolio-intelligence',
      });
      return {
        data: {
          classification: {
            type: 'DETERMINISTIC',
            facts: [
              `Total Pipeline Value: ₹${(pipeline.totalPipelineValue / 10000000).toFixed(2)} Cr`,
              `Open Opportunities: ${pipeline.totalOpportunities}`,
            ],
            limitations: ['Pipeline figures derived from CRM opportunity records.'],
          },
          pipeline,
        },
        sources,
      };
    }

    case 'getPortfolioSignals': {
      const signals = await portfolioIntelligenceService.getSignalPortfolio(ctx.user as any, args);
      sources.push({
        type: 'PORTFOLIO_INTELLIGENCE' as any,
        id: 'PORT-SIG',
        label: 'Portfolio Signal Center',
        link: '/portfolio-intelligence',
      });
      return {
        data: {
          classification: {
            type: 'DETERMINISTIC',
            facts: [
              `Active Signals: ${signals.totalActiveSignals}`,
              `Critical / High Severity: ${signals.severityBreakdown.critical + signals.severityBreakdown.high}`,
            ],
            limitations: ['Traceable event signals; no speculative alarms.'],
          },
          signals,
        },
        sources,
      };
    }

    case 'getPortfolioActions': {
      const nbas = await portfolioIntelligenceService.getNbaPortfolio(ctx.user as any, args);
      const outcomes = await portfolioIntelligenceService.getActionOutcomes(ctx.user as any, args);
      sources.push({
        type: 'PORTFOLIO_INTELLIGENCE' as any,
        id: 'PORT-ACT',
        label: 'Portfolio Actions & Outcomes',
        link: '/portfolio-intelligence',
      });
      return {
        data: {
          classification: {
            type: 'DETERMINISTIC',
            facts: [
              `Available NBAs: ${nbas.totalAvailableNbas}`,
              `Actions Executed: ${outcomes.totalExecuted}`,
            ],
            limitations: ['Explicit action logs and customer next-best-action rules.'],
          },
          nbas,
          outcomes,
        },
        sources,
      };
    }

    case 'getPortfolioChanges': {
      const changes = await portfolioIntelligenceService.getWhatChanged(ctx.user as any, args);
      sources.push({
        type: 'PORTFOLIO_INTELLIGENCE' as any,
        id: 'PORT-CHG',
        label: 'What Changed Telemetry',
        link: '/portfolio-intelligence',
      });
      return {
        data: {
          classification: {
            type: 'DETERMINISTIC',
            facts: [`Recent Material Portfolio Changes: ${changes.length}`],
            limitations: ['Derived from snapshot differentials and audit events.'],
          },
          changes,
        },
        sources,
      };
    }

    // ==========================================
    // PHASE 38: ENTERPRISE INTEGRATION TOOLS
    // ==========================================

    case 'getIntegrations': {
      const integrations = await integrationService.listIntegrations(args);
      sources.push({
        type: 'INTEGRATIONS' as any,
        id: 'INT-REGISTRY',
        label: 'Enterprise Integration Registry',
        link: '/integrations',
      });
      return {
        data: {
          classification: {
            type: 'DETERMINISTIC',
            facts: [
              `Total Integrations: ${integrations.length}`,
              `Simulators: ${integrations.filter((i) => i.mode === 'SIMULATOR').length}`,
            ],
            limitations: ['Simulators represent synthetic core banking rails, not real external networks.'],
          },
          integrations: integrations.map((i) => ({
            integrationId: i.integrationId,
            name: i.name,
            domain: i.domain,
            mode: i.mode,
            status: i.status,
            healthStatus: i.healthStatus,
            circuitBreaker: i.circuitBreaker.state,
            version: i.version,
          })),
        },
        sources,
      };
    }

    case 'getIntegration': {
      const item = await integrationService.getIntegration(args.integrationId);
      sources.push({
        type: 'INTEGRATIONS' as any,
        id: item.integrationId,
        label: `${item.name} (${item.integrationId})`,
        link: '/integrations',
      });
      return {
        data: {
          classification: {
            type: 'DETERMINISTIC',
            facts: [
              `Integration: ${item.name} [${item.status}]`,
              `Mode: ${item.mode}`,
              `Domain: ${item.domain}`,
              `Adapter: ${item.adapterType} v${item.version}`,
            ],
            limitations: ['Secrets and private API keys are omitted in accordance with security policy.'],
          },
          integration: {
            integrationId: item.integrationId,
            name: item.name,
            domain: item.domain,
            mode: item.mode,
            status: item.status,
            environment: item.environment,
            version: item.version,
            healthStatus: item.healthStatus,
            rateLimitRpm: item.rateLimitRpm,
            timeoutMs: item.timeoutMs,
            circuitBreaker: item.circuitBreaker,
          },
        },
        sources,
      };
    }

    case 'getIntegrationHealth': {
      const health = await integrationService.testConnection(args.integrationId, ctx.user as any);
      sources.push({
        type: 'INTEGRATIONS' as any,
        id: args.integrationId,
        label: `Health Check · ${args.integrationId}`,
        link: '/integrations',
      });
      return {
        data: {
          classification: {
            type: 'DETERMINISTIC',
            facts: [
              `Health Status: ${health.status}`,
              `Latency: ${health.latencyMs}ms`,
              `Circuit Breaker: ${health.details.circuitBreaker}`,
            ],
            limitations: ['Live adapter health check result.'],
          },
          health,
        },
        sources,
      };
    }

    case 'getIntegrationEvents': {
      const events = await integrationService.listEvents(args);
      sources.push({
        type: 'INTEGRATIONS' as any,
        id: 'INT-EVENTS',
        label: 'Integration Event Stream',
        link: '/integrations',
      });
      return {
        data: {
          classification: {
            type: 'DETERMINISTIC',
            facts: [`Queried Integration Events: ${events.length}`],
            limitations: ['Sensitive identifiers (PAN, Aadhaar, account numbers) are masked in payload metadata.'],
          },
          events: events.slice(0, 20).map((e) => ({
            eventId: e.eventId,
            integrationId: e.integrationId,
            eventType: e.eventType,
            direction: e.direction,
            status: e.status,
            correlationId: e.correlationId,
            latencyMs: e.latencyMs,
            createdAt: e.createdAt,
          })),
        },
        sources,
      };
    }

    case 'getIntegrationFailures': {
      const failures = await integrationService.listFailures();
      sources.push({
        type: 'INTEGRATIONS' as any,
        id: 'INT-FAILURES',
        label: 'Integration Outage & Failure Registry',
        link: '/integrations',
      });
      return {
        data: {
          classification: {
            type: 'DETERMINISTIC',
            facts: [`Active Failures & Outages: ${failures.length}`],
            limitations: ['Includes gateway timeouts, provider errors, and exhausted delivery attempts.'],
          },
          failures,
        },
        sources,
      };
    }

    case 'getWebhookDeliveries': {
      const deliveries = await integrationService.listDeliveries(args);
      sources.push({
        type: 'INTEGRATIONS' as any,
        id: 'INT-WEBHOOKS',
        label: 'Webhook Delivery Telemetry',
        link: '/integrations',
      });
      return {
        data: {
          classification: {
            type: 'DETERMINISTIC',
            facts: [`Recorded Webhook Deliveries: ${deliveries.length}`],
            limitations: ['Deliveries bound to 3 maximum retry attempts.'],
          },
          deliveries,
        },
        sources,
      };
    }

    default:
      throw new BankingError('UNKNOWN_TOOL', `Controlled tool '${toolName}' is not defined in the banking copilot registry.`, 400);
  }
}
