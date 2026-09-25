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

    default:
      throw new BankingError('UNKNOWN_TOOL', `Controlled tool '${toolName}' is not defined in the banking copilot registry.`, 400);
  }
}
