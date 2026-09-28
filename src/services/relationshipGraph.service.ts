import { db } from '../db/index.ts';
import {
  customers,
  accounts,
  accountBalances,
  loans,
  products,
  customerProducts,
  opportunities,
  serviceCases,
  tasks,
  interactions,
  interactionCommitments,
  onboardingApplications,
  documents,
  relationshipEdges,
  relationshipSnapshots,
  relationshipSignalEvents,
  customerInsights,
  relationshipEvents,
  relationshipStateHistory,
  auditLogs,
} from '../db/schema.ts';
import { eq, and, or, inArray, desc } from 'drizzle-orm';
import { resourceAuth } from '../lib/resourceAuth.ts';
import { SafeUser } from './auth.service.ts';
import { BankingError } from '../lib/errors.ts';
import { formatINR } from '../data/mockIndianBankingData.ts';
import {
  GraphNodeDTO,
  GraphEdgeDTO,
  GraphEntityType,
  GraphRelationshipType,
  GraphProvenanceType,
  RelationshipGraphResponse,
  GraphPathResponse,
  GraphAnalyticsSummary,
  GraphQueryParams,
  GraphWhatChangedItem,
  GraphEvidenceDTO,
} from '../types/relationshipGraph.types.ts';

const MAX_NODES_HARD_CAP = 120;
const MAX_EDGES_HARD_CAP = 200;

function safeIsoDate(val: any): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Date) return val.toISOString();
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {}
  return new Date().toISOString();
}

export const relationshipGraphService = {
  /**
   * Resolves and authorizes the root entity, returning a normalized GraphNodeDTO
   */
  async resolveRootNode(
    entityType: string,
    entityId: string | number,
    user: SafeUser,
    requestId: string = 'REQ-GRAPH-ROOT'
  ): Promise<{ node: GraphNodeDTO; customerId: number }> {
    const normType = entityType.toUpperCase().trim();

    switch (normType) {
      case 'CUSTOMER': {
        const customer = await resourceAuth.authorizeCustomer(user, entityId, 'VIEW_GRAPH', requestId);
        return {
          customerId: customer.id,
          node: {
            id: `customer:${customer.id}`,
            entityType: 'CUSTOMER',
            entityId: customer.id,
            code: customer.customerCode,
            label: customer.name,
            sublabel: `${customer.entityType} · ${customer.cifNumber}`,
            status: customer.status,
            depth: 0,
            isRoot: true,
            operationalPriority: customer.riskCategory === 'HIGH' ? 'HIGH' : 'NORMAL',
            metrics: {
              relationshipValue: customer.relationshipValue,
              formattedValue: formatINR(Number(customer.relationshipValue)),
              riskCategory: customer.riskCategory,
              cibilScore: customer.cibilScore,
            },
            metadata: {
              pan: customer.panNumber,
              aadhaarStatus: customer.aadhaarStatus,
              occupation: customer.occupationOrSector,
            },
            iconName: 'Users2',
          },
        };
      }

      case 'ACCOUNT': {
        const numId = Number(entityId);
        const isSafeInt = !isNaN(numId) && Number.isInteger(numId) && numId > 0 && numId <= 2147483647 && String(entityId).length <= 9;
        const condition = isSafeInt
          ? or(eq(accounts.id, numId), eq(accounts.accountNumber, String(entityId)))
          : eq(accounts.accountNumber, String(entityId));

        const found = await db
          .select({
            acc: accounts,
            bal: accountBalances,
          })
          .from(accounts)
          .leftJoin(accountBalances, eq(accounts.id, accountBalances.accountId))
          .where(condition)
          .limit(1);

        if (!found || found.length === 0) {
          throw new BankingError('ACCOUNT_NOT_FOUND', `Account record '${entityId}' not found.`, 404);
        }
        const account = found[0].acc;
        const balance = found[0].bal;
        await resourceAuth.authorizeCustomer(user, account.customerId, 'VIEW_GRAPH', requestId);
        const availBal = balance?.availableBalance || '0.00';
        return {
          customerId: account.customerId,
          node: {
            id: `account:${account.id}`,
            entityType: 'ACCOUNT',
            entityId: account.id,
            code: account.accountNumber,
            label: `${account.accountType} Account`,
            sublabel: account.accountNumber,
            status: account.status,
            depth: 0,
            isRoot: true,
            operationalPriority: account.status === 'DEBIT_FREEZE' || account.status === 'TOTAL_FREEZE' ? 'CRITICAL' : 'NORMAL',
            metrics: {
              ledgerBalance: balance?.ledgerBalance || '0.00',
              availableBalance: availBal,
              formattedBalance: formatINR(Number(availBal)),
            },
            iconName: 'WalletCards',
          },
        };
      }

      case 'LOAN': {
        const numId = Number(entityId);
        const isSafeInt = !isNaN(numId) && Number.isInteger(numId) && numId > 0 && numId <= 2147483647 && String(entityId).length <= 9;
        const condition = isSafeInt
          ? or(eq(loans.id, numId), eq(loans.loanAccountNumber, String(entityId)))
          : eq(loans.loanAccountNumber, String(entityId));

        const [loan] = await db.select().from(loans).where(condition).limit(1);
        if (!loan) {
          throw new BankingError('LOAN_NOT_FOUND', `Loan facility '${entityId}' not found.`, 404);
        }
        await resourceAuth.authorizeCustomer(user, loan.customerId, 'VIEW_GRAPH', requestId);
        return {
          customerId: loan.customerId,
          node: {
            id: `loan:${loan.id}`,
            entityType: 'LOAN',
            entityId: loan.id,
            code: loan.loanAccountNumber,
            label: `${loan.loanType.replace(/_/g, ' ')}`,
            sublabel: loan.loanAccountNumber,
            status: loan.assetClassification,
            depth: 0,
            isRoot: true,
            operationalPriority: loan.assetClassification !== 'STANDARD' ? 'HIGH' : 'NORMAL',
            metrics: {
              sanctionedLimit: loan.sanctionedLimit,
              outstandingPrincipal: loan.outstandingPrincipal,
              formattedOutstanding: formatINR(Number(loan.outstandingPrincipal)),
            },
            iconName: 'Landmark',
          },
        };
      }

      case 'OPPORTUNITY': {
        const numId = Number(entityId);
        const isSafeInt = !isNaN(numId) && Number.isInteger(numId) && numId > 0 && numId <= 2147483647 && String(entityId).length <= 9;
        const condition = isSafeInt
          ? or(eq(opportunities.id, numId), eq(opportunities.opportunityCode, String(entityId)))
          : eq(opportunities.opportunityCode, String(entityId));

        const [opp] = await db.select().from(opportunities).where(condition).limit(1);
        if (!opp) {
          throw new BankingError('OPPORTUNITY_NOT_FOUND', `Opportunity '${entityId}' not found.`, 404);
        }
        await resourceAuth.authorizeCustomer(user, opp.customerId, 'VIEW_GRAPH', requestId);
        return {
          customerId: opp.customerId,
          node: {
            id: `opportunity:${opp.id}`,
            entityType: 'OPPORTUNITY',
            entityId: opp.id,
            code: opp.opportunityCode,
            label: opp.title,
            sublabel: `${opp.stage} · ${opp.probability}%`,
            status: opp.stage,
            depth: 0,
            isRoot: true,
            operationalPriority: opp.stage === 'PROPOSAL' || opp.stage === 'NEGOTIATION' ? 'HIGH' : 'NORMAL',
            metrics: {
              expectedValue: opp.expectedValue,
              formattedValue: formatINR(Number(opp.expectedValue)),
              probability: opp.probability,
            },
            iconName: 'TrendingUp',
          },
        };
      }

      case 'SERVICE_CASE': {
        const numId = Number(entityId);
        const isSafeInt = !isNaN(numId) && Number.isInteger(numId) && numId > 0 && numId <= 2147483647 && String(entityId).length <= 9;
        const condition = isSafeInt
          ? or(eq(serviceCases.id, numId), eq(serviceCases.caseNumber, String(entityId)))
          : eq(serviceCases.caseNumber, String(entityId));

        const [sc] = await db.select().from(serviceCases).where(condition).limit(1);
        if (!sc) {
          throw new BankingError('CASE_NOT_FOUND', `Service case '${entityId}' not found.`, 404);
        }
        await resourceAuth.authorizeCustomer(user, sc.customerId, 'VIEW_GRAPH', requestId);
        return {
          customerId: sc.customerId,
          node: {
            id: `service_case:${sc.id}`,
            entityType: 'SERVICE_CASE',
            entityId: sc.id,
            code: sc.caseNumber,
            label: sc.title,
            sublabel: `${sc.category} · Priority: ${sc.priority}`,
            status: sc.status,
            depth: 0,
            isRoot: true,
            operationalPriority: sc.priority === 'CRITICAL' || sc.priority === 'HIGH' ? 'CRITICAL' : 'NORMAL',
            metrics: {
              priority: sc.priority,
              category: sc.category,
            },
            iconName: 'LifeBuoy',
          },
        };
      }

      default:
        throw new BankingError(
          'UNSUPPORTED_ROOT_ENTITY',
          `Entity type '${entityType}' is not supported as a root node in COREvia Relationship Graph. Supported roots: CUSTOMER, ACCOUNT, LOAN, OPPORTUNITY, SERVICE_CASE.`,
          400
        );
    }
  },

  /**
   * Primary Relationship Graph Resolution Engine
   * Enforces server-side authorization, bounded traversal, deterministic order, and rich provenance
   */
  async getRelationshipGraph(
    entityType: string,
    entityId: string | number,
    user: SafeUser,
    params: GraphQueryParams = {},
    requestId: string = 'REQ-GRAPH'
  ): Promise<RelationshipGraphResponse> {
    const startTime = Date.now();

    // 1. Resolve Root Node with Authorization
    const { node: rootNode, customerId } = await this.resolveRootNode(entityType, entityId, user, requestId);

    // 2. Traversal bounds
    const requestedDepth = Number(params.depth ?? 1);
    const depth = Math.min(Math.max(isNaN(requestedDepth) ? 1 : requestedDepth, 1), 3);
    const nodeCap = Math.min(params.limit || 80, MAX_NODES_HARD_CAP);

    const nodesMap = new Map<string, GraphNodeDTO>();
    const edgesMap = new Map<string, GraphEdgeDTO>();

    // Add root node
    nodesMap.set(rootNode.id, rootNode);

    // 3. Fetch Degree 1 connections from Customer Anchor
    // (A) Explicit edges from relationship_edges
    const explicitEdges = await db
      .select()
      .from(relationshipEdges)
      .where(
        and(
          eq(relationshipEdges.sourceEntityType, 'CUSTOMER'),
          eq(relationshipEdges.sourceEntityId, String(customerId)),
          eq(relationshipEdges.status, 'ACTIVE')
        )
      );

    for (const edge of explicitEdges) {
      const targetType = edge.targetEntityType as GraphEntityType;
      const targetNodeId = `${targetType.toLowerCase()}:${edge.targetEntityId}`;
      let metaObj: any = {};
      try {
        if (edge.metadata) metaObj = JSON.parse(edge.metadata);
      } catch {}

      if (!nodesMap.has(targetNodeId) && nodesMap.size < nodeCap) {
        nodesMap.set(targetNodeId, {
          id: targetNodeId,
          entityType: targetType,
          entityId: edge.targetEntityId,
          code: edge.targetEntityId,
          label: metaObj.householdName || metaObj.companyName || `${targetType} ${edge.targetEntityId}`,
          sublabel: metaObj.relationshipTier || metaObj.role || edge.relationshipType.replace(/_/g, ' '),
          status: edge.status,
          depth: 1,
          isRoot: false,
          operationalPriority: 'NORMAL',
          metadata: metaObj,
          iconName: targetType === 'HOUSEHOLD' ? 'Home' : 'Building2',
        });
      }

      const edgeId = `${rootNode.id}->${edge.relationshipType}->${targetNodeId}`;
      if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
        edgesMap.set(edgeId, {
          id: edgeId,
          source: rootNode.id,
          target: targetNodeId,
          relationshipType: edge.relationshipType as GraphRelationshipType,
          status: edge.status,
          provenanceType: edge.provenanceType as GraphProvenanceType,
          provenanceId: edge.provenanceId,
          explanation: `Customer ${rootNode.code} is formally linked to ${targetType} ${edge.targetEntityId} under registered banking constitution.`,
          evidence: edge.provenanceId ? `Document Ref: ${edge.provenanceId}` : 'Branch Record Verified',
          visibilityScope: edge.visibilityScope,
          createdAt: edge.createdAt.toISOString(),
          updatedAt: edge.updatedAt.toISOString(),
          metadata: metaObj,
        });
      }
    }

    // (B) Accounts owned by Customer
    const customerAccounts = await db
      .select({
        acc: accounts,
        bal: accountBalances,
      })
      .from(accounts)
      .leftJoin(accountBalances, eq(accounts.id, accountBalances.accountId))
      .where(eq(accounts.customerId, customerId));

    for (const item of customerAccounts) {
      const acc = item.acc;
      const bal = item.bal;
      const nodeId = `account:${acc.id}`;
      const availBal = bal?.availableBalance || '0.00';
      if (!nodesMap.has(nodeId) && nodesMap.size < nodeCap) {
        nodesMap.set(nodeId, {
          id: nodeId,
          entityType: 'ACCOUNT',
          entityId: acc.id,
          code: acc.accountNumber,
          label: `${acc.accountType} Deposit`,
          sublabel: acc.accountNumber,
          status: acc.status,
          depth: 1,
          isRoot: false,
          operationalPriority: acc.status !== 'ACTIVE' ? 'HIGH' : 'NORMAL',
          metrics: {
            balance: availBal,
            formattedBalance: formatINR(Number(availBal)),
          },
          iconName: 'WalletCards',
        });
      }

      const edgeId = `${rootNode.id}->CUSTOMER_OWNS_ACCOUNT->${nodeId}`;
      if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
        edgesMap.set(edgeId, {
          id: edgeId,
          source: rootNode.id,
          target: nodeId,
          relationshipType: 'CUSTOMER_OWNS_ACCOUNT',
          status: acc.status,
          provenanceType: 'DERIVED_FROM_ACCOUNT_OWNERSHIP',
          provenanceId: acc.accountNumber,
          explanation: `Customer ${rootNode.code} is primary KYC-verified account holder of ${acc.accountType} ${acc.accountNumber}.`,
          evidence: `Available Balance: ${formatINR(Number(availBal))}`,
          visibilityScope: 'BRANCH',
          createdAt: acc.createdAt ? new Date(acc.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: bal?.updatedAt
            ? new Date(bal.updatedAt).toISOString()
            : acc.createdAt
            ? new Date(acc.createdAt).toISOString()
            : new Date().toISOString(),
        });
      }
    }

    // (C) Loans held by Customer
    const customerLoans = await db
      .select()
      .from(loans)
      .where(eq(loans.customerId, customerId));

    for (const ln of customerLoans) {
      const nodeId = `loan:${ln.id}`;
      if (!nodesMap.has(nodeId) && nodesMap.size < nodeCap) {
        nodesMap.set(nodeId, {
          id: nodeId,
          entityType: 'LOAN',
          entityId: ln.id,
          code: ln.loanAccountNumber,
          label: `${ln.loanType.replace(/_/g, ' ')}`,
          sublabel: ln.loanAccountNumber,
          status: ln.assetClassification,
          depth: 1,
          isRoot: false,
          operationalPriority: ln.assetClassification !== 'STANDARD' ? 'CRITICAL' : 'NORMAL',
          metrics: {
            outstanding: ln.outstandingPrincipal,
            formattedOutstanding: formatINR(Number(ln.outstandingPrincipal)),
            interestRate: ln.interestRate,
          },
          iconName: 'Landmark',
        });
      }

      const edgeId = `${rootNode.id}->CUSTOMER_HAS_LOAN->${nodeId}`;
      if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
        edgesMap.set(edgeId, {
          id: edgeId,
          source: rootNode.id,
          target: nodeId,
          relationshipType: 'CUSTOMER_HAS_LOAN',
          status: ln.assetClassification,
          provenanceType: 'DIRECT_RECORD',
          provenanceId: ln.loanAccountNumber,
          explanation: `Credit facility sanctioned to customer ${rootNode.code} under classification ${ln.assetClassification}.`,
          evidence: `Sanctioned: ${formatINR(Number(ln.sanctionedLimit))} | Outstanding: ${formatINR(Number(ln.outstandingPrincipal))}`,
          visibilityScope: 'BRANCH',
          createdAt: ln.createdAt ? new Date(ln.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: ln.createdAt ? new Date(ln.createdAt).toISOString() : new Date().toISOString(),
        });
      }
    }

    // (D) Opportunities associated with Customer
    const customerOpportunities = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.customerId, customerId));

    for (const opp of customerOpportunities) {
      const nodeId = `opportunity:${opp.id}`;
      if (!nodesMap.has(nodeId) && nodesMap.size < nodeCap) {
        nodesMap.set(nodeId, {
          id: nodeId,
          entityType: 'OPPORTUNITY',
          entityId: opp.id,
          code: opp.opportunityCode,
          label: opp.title,
          sublabel: `${opp.stage} · ${opp.probability}%`,
          status: opp.stage,
          depth: 1,
          isRoot: false,
          operationalPriority: opp.stage === 'PROPOSAL' || opp.stage === 'NEGOTIATION' ? 'HIGH' : 'NORMAL',
          metrics: {
            value: opp.expectedValue,
            formattedValue: formatINR(Number(opp.expectedValue)),
            probability: opp.probability,
          },
          iconName: 'TrendingUp',
        });
      }

      const edgeId = `${rootNode.id}->CUSTOMER_HAS_OPPORTUNITY->${nodeId}`;
      if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
        edgesMap.set(edgeId, {
          id: edgeId,
          source: rootNode.id,
          target: nodeId,
          relationshipType: 'CUSTOMER_HAS_OPPORTUNITY',
          status: opp.stage,
          provenanceType: 'DERIVED_FROM_OPPORTUNITY',
          provenanceId: opp.opportunityCode,
          explanation: `Opportunity ${opp.opportunityCode} is active in pipeline for customer ${rootNode.code}.`,
          evidence: `Expected Value: ${formatINR(Number(opp.expectedValue))} (${opp.probability}% win probability)`,
          visibilityScope: 'BRANCH',
          createdAt: safeIsoDate(opp.createdAt),
          updatedAt: safeIsoDate(opp.updatedAt),
        });
      }
    }

    // (E) Service Cases
    const customerCases = await db
      .select()
      .from(serviceCases)
      .where(eq(serviceCases.customerId, customerId));

    for (const sc of customerCases) {
      const nodeId = `service_case:${sc.id}`;
      if (!nodesMap.has(nodeId) && nodesMap.size < nodeCap) {
        nodesMap.set(nodeId, {
          id: nodeId,
          entityType: 'SERVICE_CASE',
          entityId: sc.id,
          code: sc.caseNumber,
          label: sc.title,
          sublabel: `${sc.category} · Priority: ${sc.priority}`,
          status: sc.status,
          depth: 1,
          isRoot: false,
          operationalPriority: sc.priority === 'CRITICAL' ? 'CRITICAL' : sc.priority === 'HIGH' ? 'HIGH' : 'NORMAL',
          metrics: {
            priority: sc.priority,
            category: sc.category,
          },
          iconName: 'LifeBuoy',
        });
      }

      const edgeId = `${rootNode.id}->CUSTOMER_HAS_SERVICE_CASE->${nodeId}`;
      if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
        edgesMap.set(edgeId, {
          id: edgeId,
          source: rootNode.id,
          target: nodeId,
          relationshipType: 'CUSTOMER_HAS_SERVICE_CASE',
          status: sc.status,
          provenanceType: 'DERIVED_FROM_CASE',
          provenanceId: sc.caseNumber,
          explanation: `Service case ${sc.caseNumber} registered for customer ${rootNode.code}.`,
          evidence: `Category: ${sc.category} | Priority: ${sc.priority} | Status: ${sc.status}`,
          visibilityScope: 'BRANCH',
          createdAt: sc.createdAt.toISOString(),
          updatedAt: sc.updatedAt.toISOString(),
        });
      }
    }

    // (F) Products mapped via customerProducts
    const mappedProducts = await db
      .select({
        custProd: customerProducts,
        prod: products,
      })
      .from(customerProducts)
      .innerJoin(products, eq(customerProducts.productId, products.id))
      .where(eq(customerProducts.customerId, customerId));

    for (const item of mappedProducts) {
      const nodeId = `product:${item.prod.id}`;
      if (!nodesMap.has(nodeId) && nodesMap.size < nodeCap) {
        nodesMap.set(nodeId, {
          id: nodeId,
          entityType: 'PRODUCT',
          entityId: item.prod.id,
          code: item.prod.productCode,
          label: item.prod.name,
          sublabel: item.prod.category,
          status: item.custProd.status,
          depth: 1,
          isRoot: false,
          operationalPriority: 'NORMAL',
          metrics: {
            interestRate: item.prod.interestRateRange || 'Standard',
          },
          iconName: 'Package',
        });
      }

      const edgeId = `${rootNode.id}->CUSTOMER_HAS_PRODUCT->${nodeId}`;
      if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
        edgesMap.set(edgeId, {
          id: edgeId,
          source: rootNode.id,
          target: nodeId,
          relationshipType: 'CUSTOMER_HAS_PRODUCT',
          status: item.custProd.status,
          provenanceType: 'DIRECT_RECORD',
          provenanceId: item.prod.productCode,
          explanation: `Customer is enrolled in banking product ${item.prod.name}.`,
          evidence: `Product Code: ${item.prod.productCode} (${item.prod.category})`,
          visibilityScope: 'BRANCH',
          createdAt: safeIsoDate(item.custProd.enrolledDate || item.custProd.createdAt),
          updatedAt: safeIsoDate(item.custProd.enrolledDate || item.custProd.createdAt),
        });
      }
    }

    // (G) Recent Interactions
    const customerInteractions = await db
      .select()
      .from(interactions)
      .where(eq(interactions.customerId, customerId))
      .orderBy(desc(interactions.createdAt))
      .limit(10);

    for (const it of customerInteractions) {
      const isReview = it.interactionType === 'RELATIONSHIP_REVIEW' || !!it.linkedRelationshipReview;
      const entityType: GraphEntityType = isReview ? 'RELATIONSHIP_REVIEW' : 'INTERACTION';
      const nodeId = `${entityType.toLowerCase()}:${it.id}`;
      const intRef = it.interactionReference || `INT-${it.id}`;

      if (!nodesMap.has(nodeId) && nodesMap.size < nodeCap) {
        nodesMap.set(nodeId, {
          id: nodeId,
          entityType,
          entityId: it.id,
          code: intRef,
          label: it.subject,
          sublabel: `${it.interactionType.replace(/_/g, ' ')} · ${it.channel}`,
          status: it.outcome || 'RECORDED',
          depth: 1,
          isRoot: false,
          operationalPriority: it.followupRequired ? 'HIGH' : 'NORMAL',
          metrics: {
            durationMinutes: it.duration ?? 15,
            sentiment: it.sentiment || 'NEUTRAL',
          },
          iconName: isReview ? 'FileSpreadsheet' : 'MessageSquare',
        });
      }

      const relType: GraphRelationshipType = isReview ? 'CUSTOMER_HAS_REVIEW' : 'CUSTOMER_HAS_INTERACTION';
      const edgeId = `${rootNode.id}->${relType}->${nodeId}`;
      if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
        edgesMap.set(edgeId, {
          id: edgeId,
          source: rootNode.id,
          target: nodeId,
          relationshipType: relType,
          status: it.outcome || 'RECORDED',
          provenanceType: isReview ? 'DERIVED_FROM_REVIEW' : 'DERIVED_FROM_INTERACTION',
          provenanceId: intRef,
          explanation: `${isReview ? 'Formal relationship review' : 'Officer interaction'} recorded with customer ${rootNode.code}.`,
          evidence: `Channel: ${it.channel} | Outcome: ${it.outcome || 'Logged'}`,
          visibilityScope: 'BRANCH',
          createdAt: safeIsoDate(it.createdAt),
          updatedAt: safeIsoDate(it.updatedAt),
        });
      }
    }

    // (H) Tasks
    const customerTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.customerId, customerId))
      .limit(8);

    for (const t of customerTasks) {
      const nodeId = `task:${t.id}`;
      const taskCode = `TSK-${t.id}`;
      if (!nodesMap.has(nodeId) && nodesMap.size < nodeCap) {
        nodesMap.set(nodeId, {
          id: nodeId,
          entityType: 'TASK',
          entityId: t.id,
          code: taskCode,
          label: t.title,
          sublabel: `Priority: ${t.priority} · Due: ${t.dueDate || 'Open'}`,
          status: t.status,
          depth: 1,
          isRoot: false,
          operationalPriority: t.priority === 'CRITICAL' || t.priority === 'HIGH' ? 'CRITICAL' : 'NORMAL',
          metrics: {
            priority: t.priority,
            dueDate: t.dueDate,
          },
          iconName: 'CheckSquare',
        });
      }

      const edgeId = `${rootNode.id}->CUSTOMER_HAS_TASK->${nodeId}`;
      if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
        edgesMap.set(edgeId, {
          id: edgeId,
          source: rootNode.id,
          target: nodeId,
          relationshipType: 'CUSTOMER_HAS_TASK',
          status: t.status,
          provenanceType: 'DIRECT_RECORD',
          provenanceId: taskCode,
          explanation: `Operational action item assigned regarding customer ${rootNode.code}.`,
          evidence: `Priority: ${t.priority} | Status: ${t.status}`,
          visibilityScope: 'BRANCH',
          createdAt: safeIsoDate(t.createdAt),
          updatedAt: safeIsoDate(t.updatedAt),
        });
      }
    }

    // (I) Documents (authorized for branch/officer)
    const customerDocs = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.customerId, customerId),
          or(eq(documents.visibility, 'INTERNAL'), eq(documents.visibility, 'CLIENT_VISIBLE'))
        )
      )
      .limit(8);

    for (const doc of customerDocs) {
      const nodeId = `document:${doc.id}`;
      if (!nodesMap.has(nodeId) && nodesMap.size < nodeCap) {
        nodesMap.set(nodeId, {
          id: nodeId,
          entityType: 'DOCUMENT',
          entityId: doc.id,
          code: doc.documentCode,
          label: `${doc.documentType} (${doc.fileName})`,
          sublabel: `Category: ${doc.category} · Status: ${doc.status}`,
          status: doc.status,
          depth: 1,
          isRoot: false,
          operationalPriority: doc.status === 'REPLACEMENT_REQUIRED' || doc.status === 'EXPIRED' ? 'HIGH' : 'NORMAL',
          metrics: {
            category: doc.category,
            fileSize: doc.fileSize,
          },
          iconName: 'FileText',
        });
      }

      const edgeId = `${rootNode.id}->CUSTOMER_HAS_DOCUMENT->${nodeId}`;
      if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
        edgesMap.set(edgeId, {
          id: edgeId,
          source: rootNode.id,
          target: nodeId,
          relationshipType: 'CUSTOMER_HAS_DOCUMENT',
          status: doc.status,
          provenanceType: 'DERIVED_FROM_DOCUMENT',
          provenanceId: doc.documentCode,
          explanation: `Document requirement lodged for customer profile verification.`,
          evidence: `Type: ${doc.documentType} | Review Status: ${doc.reviewStatus}`,
          visibilityScope: doc.visibility,
          createdAt: safeIsoDate(doc.createdAt),
          updatedAt: safeIsoDate(doc.updatedAt),
        });
      }
    }

    // (J) Onboarding Applications
    const customerOnboarding = await db
      .select()
      .from(onboardingApplications)
      .where(eq(onboardingApplications.customerId, customerId))
      .limit(3);

    for (const onb of customerOnboarding) {
      const nodeId = `onboarding_application:${onb.id}`;
      if (!nodesMap.has(nodeId) && nodesMap.size < nodeCap) {
        nodesMap.set(nodeId, {
          id: nodeId,
          entityType: 'ONBOARDING_APPLICATION',
          entityId: onb.id,
          code: onb.applicationNumber,
          label: `Onboarding: ${onb.applicantName}`,
          sublabel: `${onb.onboardingType} · Status: ${onb.status}`,
          status: onb.status,
          depth: 1,
          isRoot: false,
          operationalPriority: onb.status === 'REJECTED' || onb.slaStatus === 'BREACHED' ? 'CRITICAL' : 'NORMAL',
          metrics: {
            stage: onb.status,
            entityType: onb.customerType,
          },
          iconName: 'UserCheck',
        });
      }

      const edgeId = `${rootNode.id}->CUSTOMER_HAS_ONBOARDING->${nodeId}`;
      if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
        edgesMap.set(edgeId, {
          id: edgeId,
          source: rootNode.id,
          target: nodeId,
          relationshipType: 'CUSTOMER_HAS_ONBOARDING',
          status: onb.status,
          provenanceType: 'DERIVED_FROM_ONBOARDING',
          provenanceId: onb.applicationNumber,
          explanation: `Onboarding journey record ${onb.applicationNumber} for customer affiliation.`,
          evidence: `Type: ${onb.onboardingType} | KYC: ${onb.kycStatus} | Status: ${onb.status}`,
          visibilityScope: 'BRANCH',
          createdAt: safeIsoDate(onb.createdAt),
          updatedAt: safeIsoDate(onb.updatedAt),
        });
      }
    }

    // (K) Active Relationship Signals & Insights
    if (params.includeSignals !== false) {
      const activeSignals = await db
        .select()
        .from(relationshipSignalEvents)
        .where(
          and(
            eq(relationshipSignalEvents.customerId, customerId),
            eq(relationshipSignalEvents.status, 'ACTIVE')
          )
        )
        .limit(5);

      for (const sig of activeSignals) {
        const nodeId = `signal:${sig.id}`;
        if (!nodesMap.has(nodeId) && nodesMap.size < nodeCap) {
          nodesMap.set(nodeId, {
            id: nodeId,
            entityType: 'SIGNAL',
            entityId: sig.id,
            code: sig.signalCode,
            label: sig.headline,
            sublabel: `Severity: ${sig.severity} · Source: ${sig.source}`,
            status: sig.status,
            depth: 1,
            isRoot: false,
            operationalPriority: sig.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
            metrics: {
              severity: sig.severity,
              sourceEngine: sig.source,
            },
            iconName: 'AlertCircle',
          });
        }

        const edgeId = `${rootNode.id}->CUSTOMER_HAS_SIGNAL->${nodeId}`;
        if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
          edgesMap.set(edgeId, {
            id: edgeId,
            source: rootNode.id,
            target: nodeId,
            relationshipType: 'CUSTOMER_HAS_SIGNAL',
            status: sig.status,
            provenanceType: 'DERIVED_FROM_SIGNAL',
            provenanceId: sig.signalCode,
            explanation: `Real-time intelligence signal generated by ${sig.source}.`,
            evidence: sig.evidence,
            visibilityScope: 'BRANCH',
            createdAt: safeIsoDate(sig.createdAt),
            updatedAt: safeIsoDate(sig.createdAt),
          });
        }
      }
    }

    // (L) Relationship State / Digital Twin Snapshot
    const [latestSnapshot] = await db
      .select()
      .from(relationshipSnapshots)
      .where(eq(relationshipSnapshots.customerId, customerId))
      .orderBy(desc(relationshipSnapshots.snapshotDate))
      .limit(1);

    if (latestSnapshot) {
      const nodeId = `relationship_state:${latestSnapshot.id}`;
      if (!nodesMap.has(nodeId) && nodesMap.size < nodeCap) {
        nodesMap.set(nodeId, {
          id: nodeId,
          entityType: 'RELATIONSHIP_STATE',
          entityId: latestSnapshot.id,
          code: `STATE-${latestSnapshot.state}`,
          label: `Twin State: ${latestSnapshot.state.replace(/_/g, ' ')}`,
          sublabel: `Momentum: ${latestSnapshot.relationshipMomentum} · Score: ${latestSnapshot.coreScore}/1000`,
          status: latestSnapshot.state,
          depth: 1,
          isRoot: false,
          operationalPriority: latestSnapshot.state === 'AT_RISK' ? 'CRITICAL' : 'NORMAL',
          metrics: {
            coreScore: latestSnapshot.coreScore,
            momentum: latestSnapshot.relationshipMomentum,
            openCasesCount: latestSnapshot.openCasesCount,
            openOpportunitiesCount: latestSnapshot.openOpportunitiesCount,
          },
          iconName: 'Activity',
        });
      }

      const edgeId = `${rootNode.id}->CUSTOMER_HAS_RELATIONSHIP_STATE->${nodeId}`;
      if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
        edgesMap.set(edgeId, {
          id: edgeId,
          source: rootNode.id,
          target: nodeId,
          relationshipType: 'CUSTOMER_HAS_RELATIONSHIP_STATE',
          status: 'ACTIVE',
          provenanceType: 'DERIVED_FROM_EXISTING_RELATIONSHIP_ENGINE',
          provenanceId: `SNAP-${latestSnapshot.id}`,
          explanation: `Synthesized relationship state from Digital Twin engine. Summary: ${latestSnapshot.summary || 'Stable relationship'}`,
          evidence: `CORE Score: ${latestSnapshot.coreScore}/1000 | Momentum: ${latestSnapshot.relationshipMomentum}`,
          visibilityScope: 'BRANCH',
          createdAt: safeIsoDate(latestSnapshot.snapshotDate || latestSnapshot.createdAt),
          updatedAt: safeIsoDate(latestSnapshot.createdAt || latestSnapshot.snapshotDate),
        });
      }
    }

    // 4. Degree 2 Traversal (if depth >= 2)
    if (depth >= 2) {
      // (A) Interactions -> Commitments
      const interactionIds = customerInteractions.map((i) => i.id);
      if (interactionIds.length > 0) {
        const commitments = await db
          .select()
          .from(interactionCommitments)
          .where(inArray(interactionCommitments.interactionId, interactionIds))
          .limit(8);

        for (const comm of commitments) {
          const commNodeId = `commitment:${comm.id}`;
          const intNodeId = `interaction:${comm.interactionId}`;

          if (!nodesMap.has(commNodeId) && nodesMap.size < nodeCap) {
            nodesMap.set(commNodeId, {
              id: commNodeId,
              entityType: 'COMMITMENT',
              entityId: comm.id,
              code: `COM-${comm.id}`,
              label: comm.description,
              sublabel: `Status: ${comm.status} · Due: ${comm.dueDate || 'Unspecified'}`,
              status: comm.status,
              depth: 2,
              isRoot: false,
              operationalPriority: comm.status === 'OVERDUE' ? 'CRITICAL' : 'NORMAL',
              metrics: {
                party: comm.commitmentType,
                dueDate: comm.dueDate,
              },
              iconName: 'CheckCheck',
            });
          }

          const edgeId = `${intNodeId}->INTERACTION_HAS_COMMITMENT->${commNodeId}`;
          if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
            edgesMap.set(edgeId, {
              id: edgeId,
              source: intNodeId,
              target: commNodeId,
              relationshipType: 'INTERACTION_HAS_COMMITMENT',
              status: comm.status,
              provenanceType: 'DERIVED_FROM_INTERACTION',
              provenanceId: `COM-${comm.id}`,
              explanation: `Commitment agreed during interaction #${comm.interactionId}.`,
              evidence: `Party: ${comm.commitmentType} | Obligation: ${comm.description}`,
              visibilityScope: 'BRANCH',
              createdAt: safeIsoDate(comm.createdAt),
              updatedAt: safeIsoDate(comm.createdAt),
            });
          }
        }
      }

      // (B) Service Cases -> Interactions or Tasks
      for (const sc of customerCases) {
        const scNodeId = `service_case:${sc.id}`;
        // Find interactions linked to this case
        const linkedInteractions = customerInteractions.filter((i) => i.linkedCaseId === sc.id);
        for (const li of linkedInteractions) {
          const itNodeId = `interaction:${li.id}`;
          const edgeId = `${scNodeId}->CASE_HAS_INTERACTION->${itNodeId}`;
          if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
            edgesMap.set(edgeId, {
              id: edgeId,
              source: scNodeId,
              target: itNodeId,
              relationshipType: 'CASE_HAS_INTERACTION',
              status: 'RESOLVED',
              provenanceType: 'DERIVED_FROM_CASE',
              provenanceId: sc.caseNumber,
              explanation: `Customer interaction conducted specifically regarding case ${sc.caseNumber}.`,
              evidence: `Interaction Ref: ${li.interactionReference}`,
              visibilityScope: 'BRANCH',
              createdAt: safeIsoDate(li.createdAt),
              updatedAt: safeIsoDate(li.updatedAt),
            });
          }
        }
      }

      // (C) Opportunities -> Interactions
      for (const opp of customerOpportunities) {
        const oppNodeId = `opportunity:${opp.id}`;
        const linkedInteractions = customerInteractions.filter((i) => i.linkedOpportunityId === opp.id);
        for (const li of linkedInteractions) {
          const itNodeId = `interaction:${li.id}`;
          const edgeId = `${oppNodeId}->OPPORTUNITY_HAS_INTERACTION->${itNodeId}`;
          if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
            edgesMap.set(edgeId, {
              id: edgeId,
              source: oppNodeId,
              target: itNodeId,
              relationshipType: 'OPPORTUNITY_HAS_INTERACTION',
              status: 'ACTIVE',
              provenanceType: 'DERIVED_FROM_OPPORTUNITY',
              provenanceId: opp.opportunityCode,
              explanation: `Engagement session logged in support of deal progression for opportunity ${opp.opportunityCode}.`,
              evidence: `Interaction Ref: ${li.interactionReference}`,
              visibilityScope: 'BRANCH',
              createdAt: safeIsoDate(li.createdAt),
              updatedAt: safeIsoDate(li.updatedAt),
            });
          }
        }
      }

      // (D) Documents -> Cases / Loans
      for (const doc of customerDocs) {
        if (doc.relatedEntityType === 'CASE' && doc.relatedEntityId) {
          const matchedCase = customerCases.find(
            (c) => c.caseNumber === doc.relatedEntityId || String(c.id) === doc.relatedEntityId
          );
          if (matchedCase) {
            const docNodeId = `document:${doc.id}`;
            const caseNodeId = `service_case:${matchedCase.id}`;
            const edgeId = `${docNodeId}->DOCUMENT_SUPPORTS_CASE->${caseNodeId}`;
            if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
              edgesMap.set(edgeId, {
                id: edgeId,
                source: docNodeId,
                target: caseNodeId,
                relationshipType: 'DOCUMENT_SUPPORTS_CASE',
                status: 'VERIFIED',
                provenanceType: 'DERIVED_FROM_DOCUMENT',
                provenanceId: doc.documentCode,
                explanation: `Document ${doc.documentCode} submitted as evidence/proof for resolution of case ${matchedCase.caseNumber}.`,
                evidence: `File: ${doc.fileName} (${doc.reviewStatus})`,
                visibilityScope: doc.visibility,
                createdAt: safeIsoDate(doc.createdAt),
                updatedAt: safeIsoDate(doc.updatedAt),
              });
            }
          }
        } else if (doc.relatedEntityType === 'LOAN' && doc.relatedEntityId) {
          const matchedLoan = customerLoans.find(
            (l) => l.loanAccountNumber === doc.relatedEntityId || String(l.id) === doc.relatedEntityId
          );
          if (matchedLoan) {
            const docNodeId = `document:${doc.id}`;
            const loanNodeId = `loan:${matchedLoan.id}`;
            const edgeId = `${docNodeId}->DOCUMENT_SUPPORTS_LOAN->${loanNodeId}`;
            if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
              edgesMap.set(edgeId, {
                id: edgeId,
                source: docNodeId,
                target: loanNodeId,
                relationshipType: 'DOCUMENT_SUPPORTS_LOAN',
                status: 'VERIFIED',
                provenanceType: 'DERIVED_FROM_DOCUMENT',
                provenanceId: doc.documentCode,
                explanation: `Collateral and credit appraisal dossier ${doc.documentCode} submitted for loan facility ${matchedLoan.loanAccountNumber}.`,
                evidence: `File: ${doc.fileName} (${doc.reviewStatus})`,
                visibilityScope: doc.visibility,
                createdAt: safeIsoDate(doc.createdAt),
                updatedAt: safeIsoDate(doc.updatedAt),
              });
            }
          }
        } else if (doc.relatedEntityType === 'ONBOARDING' && doc.relatedEntityId) {
          const matchedOnb = customerOnboarding.find(
            (o) => o.applicationNumber === doc.relatedEntityId || String(o.id) === doc.relatedEntityId
          );
          if (matchedOnb) {
            const docNodeId = `document:${doc.id}`;
            const onbNodeId = `onboarding_application:${matchedOnb.id}`;
            const edgeId = `${docNodeId}->DOCUMENT_SUPPORTS_ONBOARDING->${onbNodeId}`;
            if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
              edgesMap.set(edgeId, {
                id: edgeId,
                source: docNodeId,
                target: onbNodeId,
                relationshipType: 'DOCUMENT_SUPPORTS_ONBOARDING',
                status: 'VERIFIED',
                provenanceType: 'DERIVED_FROM_DOCUMENT',
                provenanceId: doc.documentCode,
                explanation: `KYC/KYB identity verification document submitted for onboarding application ${matchedOnb.applicationNumber}.`,
                evidence: `File: ${doc.fileName} (${doc.reviewStatus})`,
                visibilityScope: doc.visibility,
                createdAt: safeIsoDate(doc.createdAt),
                updatedAt: safeIsoDate(doc.updatedAt),
              });
            }
          }
        } else if (doc.relatedEntityType === 'OPPORTUNITY' && doc.relatedEntityId) {
          const matchedOpp = customerOpportunities.find(
            (o) => o.opportunityCode === doc.relatedEntityId || String(o.id) === doc.relatedEntityId
          );
          if (matchedOpp) {
            const docNodeId = `document:${doc.id}`;
            const oppNodeId = `opportunity:${matchedOpp.id}`;
            const edgeId = `${docNodeId}->DOCUMENT_SUPPORTS_OPPORTUNITY->${oppNodeId}`;
            if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
              edgesMap.set(edgeId, {
                id: edgeId,
                source: docNodeId,
                target: oppNodeId,
                relationshipType: 'DOCUMENT_SUPPORTS_OPPORTUNITY',
                status: 'VERIFIED',
                provenanceType: 'DERIVED_FROM_DOCUMENT',
                provenanceId: doc.documentCode,
                explanation: `Commercial mandate/term sheet document attached to opportunity ${matchedOpp.opportunityCode}.`,
                evidence: `File: ${doc.fileName} (${doc.reviewStatus})`,
                visibilityScope: doc.visibility,
                createdAt: safeIsoDate(doc.createdAt),
                updatedAt: safeIsoDate(doc.updatedAt),
              });
            }
          }
        }
      }

      // (E) Accounts -> Products (ACCOUNT_USES_PRODUCT)
      for (const item of mappedProducts) {
        if (item.custProd.accountId) {
          const accNodeId = `account:${item.custProd.accountId}`;
          const prodNodeId = `product:${item.prod.id}`;
          if (nodesMap.has(accNodeId) && nodesMap.has(prodNodeId)) {
            const edgeId = `${accNodeId}->ACCOUNT_USES_PRODUCT->${prodNodeId}`;
            if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
              edgesMap.set(edgeId, {
                id: edgeId,
                source: accNodeId,
                target: prodNodeId,
                relationshipType: 'ACCOUNT_USES_PRODUCT',
                status: item.custProd.status,
                provenanceType: 'DERIVED_FROM_ACCOUNT_OWNERSHIP',
                provenanceId: item.prod.productCode,
                explanation: `Deposit account linked to banking product catalog ${item.prod.name}.`,
                evidence: `Product Code: ${item.prod.productCode} (${item.prod.category})`,
                visibilityScope: 'BRANCH',
                createdAt: safeIsoDate(item.custProd.enrolledDate || item.custProd.createdAt),
                updatedAt: safeIsoDate(item.custProd.enrolledDate || item.custProd.createdAt),
              });
            }
          }
        }
      }

      // (F) Loans -> Products (LOAN_USES_PRODUCT)
      for (const ln of customerLoans) {
        const lnNodeId = `loan:${ln.id}`;
        const matchingProd = mappedProducts.find(
          (p) => p.prod.category === 'ASSET_LOAN' || p.prod.name.toLowerCase().includes(ln.loanType.toLowerCase().replace(/_/g, ' '))
        );
        if (matchingProd) {
          const prodNodeId = `product:${matchingProd.prod.id}`;
          if (nodesMap.has(lnNodeId) && nodesMap.has(prodNodeId)) {
            const edgeId = `${lnNodeId}->LOAN_USES_PRODUCT->${prodNodeId}`;
            if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
              edgesMap.set(edgeId, {
                id: edgeId,
                source: lnNodeId,
                target: prodNodeId,
                relationshipType: 'LOAN_USES_PRODUCT',
                status: ln.assetClassification,
                provenanceType: 'DIRECT_RECORD',
                provenanceId: matchingProd.prod.productCode,
                explanation: `Credit facility governed under product terms for ${matchingProd.prod.name}.`,
                evidence: `Facility Type: ${ln.loanType} | Sanction: ${formatINR(Number(ln.sanctionedLimit))}`,
                visibilityScope: 'BRANCH',
                createdAt: safeIsoDate(ln.sanctionDate || ln.createdAt),
                updatedAt: safeIsoDate(ln.createdAt),
              });
            }
          }
        }
      }

      // (G) Tasks -> Cases / Opportunities (CASE_HAS_TASK / OPPORTUNITY_HAS_TASK)
      for (const t of customerTasks) {
        const taskNodeId = `task:${t.id}`;
        if (t.relatedType === 'CASE' && t.relatedId) {
          const matchedCase = customerCases.find(
            (c) => String(c.id) === t.relatedId || c.caseNumber === t.relatedId
          );
          if (matchedCase) {
            const caseNodeId = `service_case:${matchedCase.id}`;
            const edgeId = `${caseNodeId}->CASE_HAS_TASK->${taskNodeId}`;
            if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
              edgesMap.set(edgeId, {
                id: edgeId,
                source: caseNodeId,
                target: taskNodeId,
                relationshipType: 'CASE_HAS_TASK',
                status: t.status,
                provenanceType: 'DERIVED_FROM_CASE',
                provenanceId: `TSK-${t.id}`,
                explanation: `Operational action item assigned for resolution of case ${matchedCase.caseNumber}.`,
                evidence: `Task: ${t.title} (Priority: ${t.priority})`,
                visibilityScope: 'BRANCH',
                createdAt: safeIsoDate(t.createdAt),
                updatedAt: safeIsoDate(t.updatedAt),
              });
            }
          }
        } else if (t.relatedType === 'OPPORTUNITY' && t.relatedId) {
          const matchedOpp = customerOpportunities.find(
            (o) => String(o.id) === t.relatedId || o.opportunityCode === t.relatedId
          );
          if (matchedOpp) {
            const oppNodeId = `opportunity:${matchedOpp.id}`;
            const edgeId = `${oppNodeId}->OPPORTUNITY_HAS_TASK->${taskNodeId}`;
            if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
              edgesMap.set(edgeId, {
                id: edgeId,
                source: oppNodeId,
                target: taskNodeId,
                relationshipType: 'OPPORTUNITY_HAS_TASK',
                status: t.status,
                provenanceType: 'DERIVED_FROM_OPPORTUNITY',
                provenanceId: `TSK-${t.id}`,
                explanation: `Follow-up operational task assigned to advance opportunity ${matchedOpp.opportunityCode}.`,
                evidence: `Task: ${t.title} (Priority: ${t.priority})`,
                visibilityScope: 'BRANCH',
                createdAt: safeIsoDate(t.createdAt),
                updatedAt: safeIsoDate(t.updatedAt),
              });
            }
          }
        }
      }
    }

    // 5. Degree 3 Traversal (if depth == 3)
    if (depth === 3) {
      // Connect Commitments to follow-up tasks if created
      const commitmentNodes = Array.from(nodesMap.values()).filter((n) => n.entityType === 'COMMITMENT');
      for (const cn of commitmentNodes) {
        const [commRec] = await db
          .select()
          .from(interactionCommitments)
          .where(eq(interactionCommitments.id, Number(cn.entityId)))
          .limit(1);

        if (commRec && commRec.createdTaskId) {
          const taskNodeId = `task:${commRec.createdTaskId}`;
          if (nodesMap.has(taskNodeId)) {
            const edgeId = `${cn.id}->INTERACTION_GENERATED_TASK->${taskNodeId}`;
            if (!edgesMap.has(edgeId) && edgesMap.size < MAX_EDGES_HARD_CAP) {
              edgesMap.set(edgeId, {
                id: edgeId,
                source: cn.id,
                target: taskNodeId,
                relationshipType: 'INTERACTION_GENERATED_TASK',
                status: 'ACTIVE',
                provenanceType: 'DERIVED_FROM_INTERACTION',
                provenanceId: `TASK-${commRec.createdTaskId}`,
                explanation: `Obligation committed during interaction triggered operational task #${commRec.createdTaskId}.`,
                evidence: `Automated commitment enforcement`,
                visibilityScope: 'BRANCH',
                createdAt: safeIsoDate(commRec.createdAt),
                updatedAt: safeIsoDate(commRec.createdAt),
              });
            }
          }
        }
      }
    }

    // 6. Apply Filter by nodeTypes or relationshipTypes if requested
    let finalNodes = Array.from(nodesMap.values());
    let finalEdges = Array.from(edgesMap.values());

    if (params.nodeTypes && params.nodeTypes.length > 0) {
      const allowedNodeTypes = new Set(params.nodeTypes.map((t) => t.toUpperCase()));
      finalNodes = finalNodes.filter((n) => n.isRoot || allowedNodeTypes.has(n.entityType));
      const allowedNodeIds = new Set(finalNodes.map((n) => n.id));
      finalEdges = finalEdges.filter((e) => allowedNodeIds.has(e.source) && allowedNodeIds.has(e.target));
    }

    if (params.relationshipTypes && params.relationshipTypes.length > 0) {
      const allowedRelTypes = new Set(params.relationshipTypes.map((r) => r.toUpperCase()));
      finalEdges = finalEdges.filter((e) => allowedRelTypes.has(e.relationshipType));
    }

    // 7. Calculate Breakdown Meta
    const entityTypeCounts: Record<string, number> = {};
    for (const n of finalNodes) {
      entityTypeCounts[n.entityType] = (entityTypeCounts[n.entityType] || 0) + 1;
    }

    const relationshipTypeCounts: Record<string, number> = {};
    for (const e of finalEdges) {
      relationshipTypeCounts[e.relationshipType] = (relationshipTypeCounts[e.relationshipType] || 0) + 1;
    }

    // 8. Extract "What Changed" Context from existing timeline records
    const recentEvents = await db
      .select()
      .from(relationshipEvents)
      .where(eq(relationshipEvents.customerId, customerId))
      .orderBy(desc(relationshipEvents.timestamp))
      .limit(6);

    const whatChangedItems: GraphWhatChangedItem[] = recentEvents.map((ev) => ({
      id: ev.id,
      title: ev.title,
      summary: ev.description || '',
      category: ev.eventType,
      timestamp: safeIsoDate(ev.timestamp || ev.createdAt),
      severity: ev.importance,
      sourceEngine: ev.sourceEntity,
    }));

    // 9. Audit graph access
    await db.insert(auditLogs).values({
      actorId: user.employeeId,
      actorName: user.name,
      action: 'RELATIONSHIP_GRAPH_VIEWED',
      resourceType: 'RELATIONSHIP_GRAPH',
      resourceId: `${entityType}:${entityId}`,
      requestId,
      outcome: 'SUCCESS',
      metadata: JSON.stringify({
        rootEntity: `${entityType}:${entityId}`,
        depth,
        nodeCount: finalNodes.length,
        edgeCount: finalEdges.length,
        durationMs: Date.now() - startTime,
      }),
    });

    return {
      root: rootNode,
      nodes: finalNodes,
      edges: finalEdges,
      meta: {
        depth,
        nodeCount: finalNodes.length,
        edgeCount: finalEdges.length,
        generatedAt: new Date().toISOString(),
        truncated: finalNodes.length >= nodeCap,
        entityTypeCounts,
        relationshipTypeCounts,
      },
      whatChanged: {
        recentEventsCount: whatChangedItems.length,
        items: whatChangedItems,
        lastEventAt: whatChangedItems[0]?.timestamp,
      },
    };
  },

  /**
   * Explores the shortest authorized path between two nodes using bounded breadth-first shortest-path traversal (BFS).
   */
  async findRelationshipPath(
    sourceType: string,
    sourceId: string | number,
    targetType: string,
    targetId: string | number,
    user: SafeUser,
    requestId: string = 'REQ-GRAPH-PATH'
  ): Promise<GraphPathResponse> {
    // 1. Resolve and authorize both endpoints
    const src = await this.resolveRootNode(sourceType, sourceId, user, requestId);
    const tgt = await this.resolveRootNode(targetType, targetId, user, requestId);

    // 2. Fetch depth 2 graph for the source
    const graph = await this.getRelationshipGraph(sourceType, sourceId, user, { depth: 2, limit: 120 }, requestId);

    // 3. BFS search from src to tgt
    const adjacency = new Map<string, Array<{ neighborId: string; edge: GraphEdgeDTO }>>();
    for (const node of graph.nodes) {
      adjacency.set(node.id, []);
    }

    for (const edge of graph.edges) {
      if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
      if (!adjacency.has(edge.target)) adjacency.set(edge.target, []);
      adjacency.get(edge.source)!.push({ neighborId: edge.target, edge });
      // Undirected traversal for connectivity path
      adjacency.get(edge.target)!.push({ neighborId: edge.source, edge });
    }

    const startId = src.node.id;
    const endId = tgt.node.id;

    if (startId === endId) {
      return {
        found: true,
        pathLength: 0,
        nodes: [src.node],
        edges: [],
        explanation: 'Source and target refer to the exact same banking entity.',
      };
    }

    const queue: Array<{ current: string; pathNodes: string[]; pathEdges: GraphEdgeDTO[] }> = [
      { current: startId, pathNodes: [startId], pathEdges: [] },
    ];
    const visited = new Set<string>([startId]);

    let foundPath: { pathNodes: string[]; pathEdges: GraphEdgeDTO[] } | null = null;

    while (queue.length > 0) {
      const { current, pathNodes, pathEdges } = queue.shift()!;
      if (current === endId) {
        foundPath = { pathNodes, pathEdges };
        break;
      }

      if (pathNodes.length > 5) continue; // limit path depth to 5 hops

      const neighbors = adjacency.get(current) || [];
      for (const { neighborId, edge } of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({
            current: neighborId,
            pathNodes: [...pathNodes, neighborId],
            pathEdges: [...pathEdges, edge],
          });
        }
      }
    }

    if (!foundPath) {
      return {
        found: false,
        pathLength: 0,
        nodes: [],
        edges: [],
        explanation: `No direct authorized relationship path found between ${src.node.label} and ${tgt.node.label} within 4 hops.`,
      };
    }

    const nodeLookup = new Map(graph.nodes.map((n) => [n.id, n]));
    const resultNodes: GraphNodeDTO[] = foundPath.pathNodes
      .map((id) => nodeLookup.get(id))
      .filter((n): n is GraphNodeDTO => Boolean(n));

    // Audit path view
    await db.insert(auditLogs).values({
      actorId: user.employeeId,
      actorName: user.name,
      action: 'RELATIONSHIP_GRAPH_PATH_VIEWED',
      resourceType: 'RELATIONSHIP_GRAPH',
      resourceId: `${sourceType}:${sourceId}->${targetType}:${targetId}`,
      requestId,
      outcome: 'SUCCESS',
      metadata: JSON.stringify({
        hops: foundPath.pathEdges.length,
      }),
    });

    const stepsDesc = resultNodes.map((n) => `${n.entityType} (${n.label})`).join(' → ');

    return {
      found: true,
      pathLength: foundPath.pathEdges.length,
      nodes: resultNodes,
      edges: foundPath.pathEdges,
      explanation: `Path identified via ${foundPath.pathEdges.length} hops: ${stepsDesc}.`,
    };
  },

  /**
   * Retrieves immediate degree-1 neighbors of an entity
   */
  async getRelationshipNeighbors(
    entityType: string,
    entityId: string | number,
    user: SafeUser,
    requestId: string = 'REQ-GRAPH-NEIGHBORS'
  ) {
    const graph = await this.getRelationshipGraph(entityType, entityId, user, { depth: 1 }, requestId);
    return {
      root: graph.root,
      neighborsCount: graph.nodes.length - 1,
      neighbors: graph.nodes.filter((n) => !n.isRoot),
      edges: graph.edges,
    };
  },

  /**
   * Exposes detailed provenance and verification evidence for an edge with full database validation & RBAC
   */
  async getRelationshipEvidence(
    edgeId: string,
    user: SafeUser,
    requestId: string = 'REQ-GRAPH-EVIDENCE'
  ): Promise<GraphEvidenceDTO> {
    if (!edgeId || typeof edgeId !== 'string' || !edgeId.trim()) {
      throw new BankingError('INVALID_EDGE_ID', 'A valid relationship edgeId must be provided.', 400);
    }

    let srcType = '';
    let srcId = '';
    let relType = '';
    let tgtType = '';
    let tgtId = '';

    if (edgeId.includes('->')) {
      const parts = edgeId.split('->');
      if (parts.length === 3) {
        const [sourcePart, relTypeStr, targetPart] = parts;
        const [st, si] = sourcePart.split(':');
        const [tt, ti] = targetPart.split(':');
        srcType = st || '';
        srcId = si || '';
        relType = relTypeStr || '';
        tgtType = tt || '';
        tgtId = ti || '';
      }
    } else {
      const numEdgeId = Number(edgeId);
      if (!isNaN(numEdgeId)) {
        const [dbEdge] = await db
          .select()
          .from(relationshipEdges)
          .where(eq(relationshipEdges.id, numEdgeId))
          .limit(1);
        if (dbEdge) {
          srcType = dbEdge.sourceEntityType.toLowerCase();
          srcId = dbEdge.sourceEntityId;
          relType = dbEdge.relationshipType;
          tgtType = dbEdge.targetEntityType.toLowerCase();
          tgtId = dbEdge.targetEntityId;
        }
      }
    }

    if (!srcType || !srcId || !relType || !tgtType || !tgtId) {
      throw new BankingError('INVALID_EDGE_ID', `Edge identifier '${edgeId}' could not be parsed into valid graph components.`, 400);
    }

    // 1. Verify existence of underlying record and extract associated customer ID
    let associatedCustomerId: number | null = null;
    let sourceLabel = `${srcType.toUpperCase()} ${srcId}`;
    let targetLabel = `${tgtType.toUpperCase()} ${tgtId}`;
    let sourceCode = srcId;
    let targetCode = tgtId;
    let tableName = 'relationship_edges';
    let recordId: string | number = edgeId;
    let recordStatus = 'ACTIVE';
    let provenanceType: GraphProvenanceType = 'DIRECT_RECORD';
    let explanation = `Verified relationship connection between ${srcType} and ${tgtType}.`;
    let evidenceText: string | null = null;
    let createdAtStr = new Date().toISOString();
    let updatedAtStr = new Date().toISOString();

    if (relType === 'CUSTOMER_OWNS_ACCOUNT') {
      const custIdNum = Number(srcId);
      associatedCustomerId = custIdNum;
      const [acc] = await db
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.customerId, custIdNum),
            Number(tgtId) <= 2147483647
              ? or(eq(accounts.id, Number(tgtId)), eq(accounts.accountNumber, String(tgtId)))
              : eq(accounts.accountNumber, String(tgtId))
          )
        )
        .limit(1);

      if (!acc) {
        throw new BankingError('EDGE_NOT_FOUND', `Relationship edge '${edgeId}' not found in database.`, 404);
      }
      tableName = 'accounts';
      recordId = acc.id;
      recordStatus = acc.status;
      sourceLabel = `Customer #${srcId}`;
      targetLabel = `${acc.accountType} Account (${acc.accountNumber})`;
      targetCode = acc.accountNumber;
      explanation = `Customer #${srcId} is the primary verified account holder of ${acc.accountType} Account ${acc.accountNumber}.`;
      evidenceText = `Core Banking Account Ledger Record | Status: ${acc.status}`;
      createdAtStr = safeIsoDate(acc.createdAt);
      updatedAtStr = safeIsoDate(acc.createdAt);
    } else if (relType === 'CUSTOMER_HAS_LOAN') {
      const custIdNum = Number(srcId);
      associatedCustomerId = custIdNum;
      const [loan] = await db
        .select()
        .from(loans)
        .where(
          and(
            eq(loans.customerId, custIdNum),
            Number(tgtId) <= 2147483647
              ? or(eq(loans.id, Number(tgtId)), eq(loans.loanAccountNumber, String(tgtId)))
              : eq(loans.loanAccountNumber, String(tgtId))
          )
        )
        .limit(1);

      if (!loan) {
        throw new BankingError('EDGE_NOT_FOUND', `Relationship edge '${edgeId}' not found in database.`, 404);
      }
      tableName = 'loans';
      recordId = loan.id;
      recordStatus = loan.assetClassification;
      targetLabel = `${loan.loanType.replace(/_/g, ' ')} (${loan.loanAccountNumber})`;
      targetCode = loan.loanAccountNumber;
      explanation = `Credit facility sanctioned to customer #${srcId} under facility agreement.`;
      evidenceText = `Sanctioned Limit: ${formatINR(Number(loan.sanctionedLimit))} | Outstanding: ${formatINR(Number(loan.outstandingPrincipal))}`;
      createdAtStr = safeIsoDate(loan.createdAt);
      updatedAtStr = safeIsoDate(loan.createdAt);
    } else if (relType === 'CUSTOMER_HAS_OPPORTUNITY') {
      const custIdNum = Number(srcId);
      associatedCustomerId = custIdNum;
      const [opp] = await db
        .select()
        .from(opportunities)
        .where(
          and(
            eq(opportunities.customerId, custIdNum),
            Number(tgtId) <= 2147483647
              ? or(eq(opportunities.id, Number(tgtId)), eq(opportunities.opportunityCode, String(tgtId)))
              : eq(opportunities.opportunityCode, String(tgtId))
          )
        )
        .limit(1);

      if (!opp) {
        throw new BankingError('EDGE_NOT_FOUND', `Relationship edge '${edgeId}' not found in database.`, 404);
      }
      tableName = 'opportunities';
      recordId = opp.id;
      recordStatus = opp.stage;
      provenanceType = 'DERIVED_FROM_OPPORTUNITY';
      targetLabel = opp.title;
      targetCode = opp.opportunityCode;
      explanation = `Opportunity ${opp.opportunityCode} lodged under customer relationship portfolio.`;
      evidenceText = `Stage: ${opp.stage} | Probability: ${opp.probability}%`;
      createdAtStr = safeIsoDate(opp.createdAt);
      updatedAtStr = safeIsoDate(opp.updatedAt);
    } else if (relType === 'CUSTOMER_HAS_SERVICE_CASE') {
      const custIdNum = Number(srcId);
      associatedCustomerId = custIdNum;
      const [sc] = await db
        .select()
        .from(serviceCases)
        .where(
          and(
            eq(serviceCases.customerId, custIdNum),
            Number(tgtId) <= 2147483647
              ? or(eq(serviceCases.id, Number(tgtId)), eq(serviceCases.caseNumber, String(tgtId)))
              : eq(serviceCases.caseNumber, String(tgtId))
          )
        )
        .limit(1);

      if (!sc) {
        throw new BankingError('EDGE_NOT_FOUND', `Relationship edge '${edgeId}' not found in database.`, 404);
      }
      tableName = 'service_cases';
      recordId = sc.id;
      recordStatus = sc.status;
      provenanceType = 'DERIVED_FROM_CASE';
      targetLabel = sc.title;
      targetCode = sc.caseNumber;
      explanation = `Customer service case ticket ${sc.caseNumber} recorded in ticketing registry.`;
      evidenceText = `Category: ${sc.category} | Priority: ${sc.priority} | Status: ${sc.status}`;
      createdAtStr = safeIsoDate(sc.createdAt);
      updatedAtStr = safeIsoDate(sc.updatedAt);
    } else if (relType === 'CUSTOMER_HAS_PRODUCT') {
      const custIdNum = Number(srcId);
      associatedCustomerId = custIdNum;
      const [cp] = await db
        .select({
          custProd: customerProducts,
          prod: products,
        })
        .from(customerProducts)
        .innerJoin(products, eq(customerProducts.productId, products.id))
        .where(
          and(
            eq(customerProducts.customerId, custIdNum),
            or(eq(customerProducts.productId, Number(tgtId)), eq(customerProducts.id, Number(tgtId)))
          )
        )
        .limit(1);

      if (!cp) {
        throw new BankingError('EDGE_NOT_FOUND', `Relationship edge '${edgeId}' not found in database.`, 404);
      }
      tableName = 'customer_products';
      recordId = cp.custProd.id;
      recordStatus = cp.custProd.status;
      targetLabel = cp.prod.name;
      targetCode = cp.prod.productCode;
      explanation = `Customer subscribed to banking product ${cp.prod.name} (${cp.prod.category}).`;
      evidenceText = `Product Code: ${cp.prod.productCode} | Enrolled: ${safeIsoDate(cp.custProd.enrolledDate)}`;
      createdAtStr = safeIsoDate(cp.custProd.createdAt);
      updatedAtStr = safeIsoDate(cp.custProd.createdAt);
    } else if (relType === 'CUSTOMER_HAS_INTERACTION' || relType === 'CUSTOMER_HAS_REVIEW') {
      const custIdNum = Number(srcId);
      associatedCustomerId = custIdNum;
      const [it] = await db
        .select()
        .from(interactions)
        .where(
          and(
            eq(interactions.customerId, custIdNum),
            or(eq(interactions.id, Number(tgtId)), eq(interactions.interactionReference, String(tgtId)))
          )
        )
        .limit(1);

      if (!it) {
        throw new BankingError('EDGE_NOT_FOUND', `Relationship edge '${edgeId}' not found in database.`, 404);
      }
      tableName = 'interactions';
      recordId = it.id;
      recordStatus = it.outcome || 'RECORDED';
      provenanceType = relType === 'CUSTOMER_HAS_REVIEW' ? 'DERIVED_FROM_REVIEW' : 'DERIVED_FROM_INTERACTION';
      targetLabel = it.subject;
      targetCode = it.interactionReference || `INT-${it.id}`;
      explanation = `Customer interaction log registered on channel ${it.channel}.`;
      evidenceText = `Interaction Ref: ${it.interactionReference} | Subject: ${it.subject}`;
      createdAtStr = safeIsoDate(it.createdAt);
      updatedAtStr = safeIsoDate(it.updatedAt);
    } else if (relType === 'CUSTOMER_HAS_TASK') {
      const custIdNum = Number(srcId);
      associatedCustomerId = custIdNum;
      const [tsk] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.customerId, custIdNum), eq(tasks.id, Number(tgtId))))
        .limit(1);

      if (!tsk) {
        throw new BankingError('EDGE_NOT_FOUND', `Relationship edge '${edgeId}' not found in database.`, 404);
      }
      tableName = 'tasks';
      recordId = tsk.id;
      recordStatus = tsk.status;
      targetLabel = tsk.title;
      targetCode = `TSK-${tsk.id}`;
      explanation = `Operational work item assigned for customer account maintenance.`;
      evidenceText = `Priority: ${tsk.priority} | Due: ${tsk.dueDate}`;
      createdAtStr = safeIsoDate(tsk.createdAt);
      updatedAtStr = safeIsoDate(tsk.updatedAt);
    } else if (relType === 'CUSTOMER_HAS_DOCUMENT') {
      const custIdNum = Number(srcId);
      associatedCustomerId = custIdNum;
      const [doc] = await db
        .select()
        .from(documents)
        .where(and(eq(documents.customerId, custIdNum), eq(documents.id, Number(tgtId))))
        .limit(1);

      if (!doc) {
        throw new BankingError('EDGE_NOT_FOUND', `Relationship edge '${edgeId}' not found in database.`, 404);
      }
      tableName = 'documents';
      recordId = doc.id;
      recordStatus = doc.status;
      provenanceType = 'DERIVED_FROM_DOCUMENT';
      targetLabel = doc.fileName;
      targetCode = doc.documentCode;
      explanation = `Statutory customer document lodged in banking document intelligence vault.`;
      evidenceText = `Doc Code: ${doc.documentCode} | Type: ${doc.documentType} | Review Status: ${doc.reviewStatus}`;
      createdAtStr = safeIsoDate(doc.createdAt);
      updatedAtStr = safeIsoDate(doc.updatedAt);
    } else if (relType === 'CUSTOMER_HAS_SIGNAL') {
      const custIdNum = Number(srcId);
      associatedCustomerId = custIdNum;
      const [sig] = await db
        .select()
        .from(relationshipSignalEvents)
        .where(and(eq(relationshipSignalEvents.customerId, custIdNum), eq(relationshipSignalEvents.id, Number(tgtId))))
        .limit(1);

      if (!sig) {
        throw new BankingError('EDGE_NOT_FOUND', `Relationship edge '${edgeId}' not found in database.`, 404);
      }
      tableName = 'relationship_signal_events';
      recordId = sig.id;
      recordStatus = sig.status;
      provenanceType = 'DERIVED_FROM_SIGNAL';
      targetLabel = sig.headline;
      targetCode = sig.signalCode;
      explanation = `Intelligence signal generated by ${sig.source} engine.`;
      evidenceText = sig.evidence;
      createdAtStr = safeIsoDate(sig.createdAt);
      updatedAtStr = safeIsoDate(sig.createdAt);
    } else {
      // Check explicit relationship_edges table
      const [dbEdge] = await db
        .select()
        .from(relationshipEdges)
        .where(
          and(
            eq(relationshipEdges.sourceEntityType, srcType.toUpperCase()),
            eq(relationshipEdges.sourceEntityId, String(srcId)),
            eq(relationshipEdges.targetEntityId, String(tgtId)),
            eq(relationshipEdges.relationshipType, relType)
          )
        )
        .limit(1);

      if (!dbEdge) {
        throw new BankingError('EDGE_NOT_FOUND', `Relationship edge '${edgeId}' not found in database.`, 404);
      }

      tableName = 'relationship_edges';
      recordId = dbEdge.id;
      recordStatus = dbEdge.status;
      let edgeMeta: any = {};
      try {
        if (dbEdge.metadata) edgeMeta = JSON.parse(dbEdge.metadata);
      } catch {}

      provenanceType = dbEdge.provenanceType as GraphProvenanceType;
      explanation = edgeMeta.explanation || `Governed banking edge record in relationship_edges registry.`;
      evidenceText = edgeMeta.evidence || (dbEdge.provenanceId ? `Document Ref: ${dbEdge.provenanceId}` : 'Verified relational record in COREvia PostgreSQL.');
      createdAtStr = safeIsoDate(dbEdge.createdAt);
      updatedAtStr = safeIsoDate(dbEdge.updatedAt);

      if (srcType.toUpperCase() === 'CUSTOMER') {
        associatedCustomerId = Number(srcId);
      } else if (tgtType.toUpperCase() === 'CUSTOMER') {
        associatedCustomerId = Number(tgtId);
      }
    }

    // 2. Perform server-side resource authorization
    if (associatedCustomerId && !isNaN(associatedCustomerId)) {
      await resourceAuth.authorizeCustomer(user, associatedCustomerId, 'VIEW_GRAPH_EVIDENCE', requestId);
    }

    // 3. Insert regulatory audit log for evidence retrieval
    await db.insert(auditLogs).values({
      actorId: user.employeeId,
      actorName: user.name,
      action: 'RELATIONSHIP_GRAPH_EVIDENCE_ACCESSED',
      resourceType: 'RELATIONSHIP_EDGE',
      resourceId: edgeId,
      requestId,
      outcome: 'SUCCESS',
      metadata: JSON.stringify({
        relationshipType: relType,
        source: `${srcType}:${srcId}`,
        target: `${tgtType}:${tgtId}`,
        associatedCustomerId,
      }),
    });

    return {
      edgeId,
      source: {
        entityType: srcType.toUpperCase() as GraphEntityType,
        entityId: srcId,
        code: sourceCode,
        label: sourceLabel,
      },
      target: {
        entityType: tgtType.toUpperCase() as GraphEntityType,
        entityId: tgtId,
        code: targetCode,
        label: targetLabel,
      },
      relationshipType: relType as GraphRelationshipType,
      relationshipStrength: 'HIGH',
      status: recordStatus,
      createdAt: createdAtStr,
      updatedAt: updatedAtStr,
      sourceRecord: {
        tableName,
        recordId,
        status: recordStatus,
      },
      provenance: {
        provenanceType,
        provenanceId: targetCode,
        explanation,
        evidence: evidenceText,
      },
      authorization: {
        authorized: true,
        requestingUser: user.name,
        role: user.role,
        employeeId: user.employeeId,
      },
      audit: {
        retrievedAt: new Date().toISOString(),
        requestId,
        dataSource: 'Relationship record retrieved from COREvia PostgreSQL synthetic dataset.',
        regulatoryAuditStatus: 'VERIFIED_POSTGRESQL_RECORD',
      },
    };
  },

  /**
   * Graph Analytics Summary
   * Supports customer-scoped analytics when customerId is provided, or portfolio-scoped analytics across authorized portfolio
   */
  async getGraphAnalytics(
    user: SafeUser,
    customerId?: number | string
  ): Promise<GraphAnalyticsSummary> {
    if (customerId) {
      const custIdNum = Number(customerId);
      const isSafeInt = !isNaN(custIdNum) && Number.isInteger(custIdNum) && custIdNum > 0 && custIdNum <= 2147483647;
      const targetCustomer = await db
        .select()
        .from(customers)
        .where(
          isSafeInt
            ? or(eq(customers.id, custIdNum), eq(customers.cifNumber, String(customerId)))
            : eq(customers.cifNumber, String(customerId))
        )
        .limit(1);

      if (!targetCustomer || targetCustomer.length === 0) {
        throw new BankingError('CUSTOMER_NOT_FOUND', `Customer '${customerId}' not found for graph analytics.`, 404);
      }
      const cust = targetCustomer[0];
      await resourceAuth.authorizeCustomer(user, cust.id, 'VIEW_GRAPH_ANALYTICS');

      const graph = await this.getRelationshipGraph('CUSTOMER', cust.id, user, { depth: 2, limit: 100 });
      const totalNodes = graph.nodes.length;
      const totalEdges = graph.edges.length;
      const averageDegree = totalNodes > 0 ? Number(((totalEdges * 2) / totalNodes).toFixed(2)) : 0;

      const degrees = new Map<string, number>();
      for (const e of graph.edges) {
        degrees.set(e.source, (degrees.get(e.source) || 0) + 1);
        degrees.set(e.target, (degrees.get(e.target) || 0) + 1);
      }

      const mostConnected = graph.nodes
        .map((n) => ({
          id: n.id,
          label: n.label,
          type: n.entityType,
          degree: degrees.get(n.id) || 0,
        }))
        .sort((a, b) => b.degree - a.degree)
        .slice(0, 5);

      return {
        totalNodes,
        totalEdges,
        averageDegree,
        nodesByType: graph.meta.entityTypeCounts,
        edgesByType: graph.meta.relationshipTypeCounts,
        mostConnectedEntities: mostConnected,
      };
    }

    // Portfolio Scope: aggregate across user's authorized portfolio (never silently fall back to customer 1)
    let portfolioCustomers: Array<{ id: number; name: string }>;
    if (['ADMINISTRATOR', 'BRANCH_OPS_HEAD', 'BRANCH_MANAGER', 'AUDITOR'].includes(user.role)) {
      portfolioCustomers = await db.select({ id: customers.id, name: customers.name }).from(customers).limit(8);
    } else {
      portfolioCustomers = await db
        .select({ id: customers.id, name: customers.name })
        .from(customers)
        .where(eq(customers.assignedRmId, user.id))
        .limit(8);
    }

    if (!portfolioCustomers || portfolioCustomers.length === 0) {
      return {
        totalNodes: 0,
        totalEdges: 0,
        averageDegree: 0,
        nodesByType: {},
        edgesByType: {},
        mostConnectedEntities: [],
      };
    }

    const aggregatedNodes = new Map<string, GraphNodeDTO>();
    const aggregatedEdges = new Map<string, GraphEdgeDTO>();
    const entityTypeCounts: Record<string, number> = {};
    const relationshipTypeCounts: Record<string, number> = {};

    for (const c of portfolioCustomers) {
      try {
        const subGraph = await this.getRelationshipGraph('CUSTOMER', c.id, user, { depth: 1, limit: 30 });
        for (const n of subGraph.nodes) {
          if (!aggregatedNodes.has(n.id)) {
            aggregatedNodes.set(n.id, n);
            entityTypeCounts[n.entityType] = (entityTypeCounts[n.entityType] || 0) + 1;
          }
        }
        for (const e of subGraph.edges) {
          if (!aggregatedEdges.has(e.id)) {
            aggregatedEdges.set(e.id, e);
            relationshipTypeCounts[e.relationshipType] = (relationshipTypeCounts[e.relationshipType] || 0) + 1;
          }
        }
      } catch {}
    }

    const totalNodes = aggregatedNodes.size;
    const totalEdges = aggregatedEdges.size;
    const averageDegree = totalNodes > 0 ? Number(((totalEdges * 2) / totalNodes).toFixed(2)) : 0;

    const degrees = new Map<string, number>();
    for (const e of aggregatedEdges.values()) {
      degrees.set(e.source, (degrees.get(e.source) || 0) + 1);
      degrees.set(e.target, (degrees.get(e.target) || 0) + 1);
    }

    const mostConnected = Array.from(aggregatedNodes.values())
      .map((n) => ({
        id: n.id,
        label: n.label,
        type: n.entityType,
        degree: degrees.get(n.id) || 0,
      }))
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 5);

    return {
      totalNodes,
      totalEdges,
      averageDegree,
      nodesByType: entityTypeCounts,
      edgesByType: relationshipTypeCounts,
      mostConnectedEntities: mostConnected,
    };
  },
};
