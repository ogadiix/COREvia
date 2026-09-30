/**
 * COREvia Phase 31: Governed Agent Context Resolver
 * Resolves context server-side across all COREvia domains with strict RBAC, IDOR protection,
 * and data minimization (no raw data dumps to model context).
 */

import { db } from '../../db/index.ts';
import {
  customers,
  accounts,
  loans,
  opportunities,
  serviceCases,
  tasks,
  customerScores,
  relationshipScenarios,
} from '../../db/schema.ts';
import { eq, and, sql, desc } from 'drizzle-orm';
import { SafeUser } from '../auth.service.ts';
import { resourceAuth } from '../../lib/resourceAuth.ts';
import { BankingError } from '../../lib/errors.ts';
import { AgentContextType, AgentExecutionContextDTO } from '../../types/agent.types.ts';

export const contextResolver = {
  /**
   * Resolves and server-side authorizes agent context based on launch origin
   */
  async resolveContext(params: {
    user: SafeUser;
    contextType: AgentContextType;
    contextId?: string | null;
    customerId?: number | null;
    requestId: string;
  }): Promise<AgentExecutionContextDTO> {
    const { user, contextType, contextId, customerId: rawCustomerId, requestId } = params;

    if (!user) {
      throw new BankingError('UNAUTHENTICATED', 'Officer authentication required to resolve agent context.', 401);
    }

    let targetCustomerId: number | null = rawCustomerId ? Number(rawCustomerId) : null;
    let contextEntitySummary = '';

    // 1. Resolve customer ID based on context type & verify resource authorization
    switch (contextType) {
      case 'CUSTOMER': {
        const idToResolve = targetCustomerId || (contextId ? Number(contextId) : null);
        if (!idToResolve && !contextId) {
          throw new BankingError('VALIDATION_ERROR', 'Customer ID or Code is required for CUSTOMER context.', 400);
        }
        const cust = await resourceAuth.authorizeCustomer(user, idToResolve || String(contextId), 'AGENT_CONTEXT_RESOLVE', requestId);
        targetCustomerId = cust.id;
        contextEntitySummary = `Direct Customer 360 inspection for ${cust.name} (${cust.customerCode})`;
        break;
      }

      case 'ACCOUNT': {
        if (!contextId) {
          throw new BankingError('VALIDATION_ERROR', 'Account number or ID is required for ACCOUNT context.', 400);
        }
        const accNum = String(contextId);
        const [acc] = await db
          .select({
            id: accounts.id,
            accountNumber: accounts.accountNumber,
            accountType: accounts.accountType,
            customerId: accounts.customerId,
          })
          .from(accounts)
          .where(sql`${accounts.accountNumber} = ${accNum} OR ${accounts.id}::text = ${accNum}`)
          .limit(1);

        if (!acc) {
          throw new BankingError('ACCOUNT_NOT_FOUND', `Account ${accNum} does not exist.`, 404);
        }

        const cust = await resourceAuth.authorizeCustomer(user, acc.customerId, 'AGENT_CONTEXT_RESOLVE', requestId);
        targetCustomerId = cust.id;
        contextEntitySummary = `Account ${acc.accountNumber} (${acc.accountType}) for ${cust.name}`;
        break;
      }

      case 'LOAN': {
        if (!contextId) {
          throw new BankingError('VALIDATION_ERROR', 'Loan number or ID is required for LOAN context.', 400);
        }
        const loanId = String(contextId);
        const [ln] = await db
          .select({
            id: loans.id,
            loanAccountNumber: loans.loanAccountNumber,
            loanType: loans.loanType,
            customerId: loans.customerId,
          })
          .from(loans)
          .where(sql`${loans.loanAccountNumber} = ${loanId} OR ${loans.id}::text = ${loanId}`)
          .limit(1);

        if (!ln) {
          throw new BankingError('LOAN_NOT_FOUND', `Facility loan ${loanId} does not exist.`, 404);
        }

        const cust = await resourceAuth.authorizeCustomer(user, ln.customerId, 'AGENT_CONTEXT_RESOLVE', requestId);
        targetCustomerId = cust.id;
        contextEntitySummary = `Loan Facility ${ln.loanAccountNumber} (${ln.loanType}) for ${cust.name}`;
        break;
      }

      case 'OPPORTUNITY': {
        if (!contextId) {
          throw new BankingError('VALIDATION_ERROR', 'Opportunity code or ID is required for OPPORTUNITY context.', 400);
        }
        const oppId = String(contextId);
        const [opp] = await db
          .select({
            id: opportunities.id,
            opportunityCode: opportunities.opportunityCode,
            title: opportunities.title,
            customerId: opportunities.customerId,
            stage: opportunities.stage,
          })
          .from(opportunities)
          .where(sql`${opportunities.opportunityCode} = ${oppId} OR ${opportunities.id}::text = ${oppId}`)
          .limit(1);

        if (!opp) {
          throw new BankingError('OPPORTUNITY_NOT_FOUND', `Opportunity ${oppId} does not exist.`, 404);
        }

        const cust = await resourceAuth.authorizeCustomer(user, opp.customerId, 'AGENT_CONTEXT_RESOLVE', requestId);
        targetCustomerId = cust.id;
        contextEntitySummary = `Opportunity ${opp.opportunityCode} ("${opp.title}" - Stage: ${opp.stage}) for ${cust.name}`;
        break;
      }

      case 'SERVICE_CASE': {
        if (!contextId) {
          throw new BankingError('VALIDATION_ERROR', 'Case number or ID is required for SERVICE_CASE context.', 400);
        }
        const caseRecord = await resourceAuth.authorizeCase(user, Number(contextId) || 0, 'AGENT_CONTEXT_RESOLVE', requestId);
        targetCustomerId = caseRecord.customerId;
        contextEntitySummary = `Service Case ${caseRecord.caseNumber} ("${caseRecord.title}" - Status: ${caseRecord.status})`;
        break;
      }

      case 'RELATIONSHIP_REVIEW':
      case 'SIGNAL':
      case 'DIGITAL_TWIN': {
        const idToResolve = targetCustomerId || (contextId ? Number(contextId) : null);
        if (!idToResolve) {
          throw new BankingError('VALIDATION_ERROR', `Target customer is required for ${contextType} context.`, 400);
        }
        const cust = await resourceAuth.authorizeCustomer(user, idToResolve, 'AGENT_CONTEXT_RESOLVE', requestId);
        targetCustomerId = cust.id;
        contextEntitySummary = `${contextType.replace('_', ' ')} context for customer ${cust.name} (${cust.customerCode})`;
        break;
      }

      case 'STRATEGY_SCENARIO': {
        if (!contextId) {
          throw new BankingError('VALIDATION_ERROR', 'Scenario ID is required for STRATEGY_SCENARIO context.', 400);
        }
        const [scen] = await db
          .select()
          .from(relationshipScenarios)
          .where(sql`${relationshipScenarios.scenarioId} = ${contextId} OR ${relationshipScenarios.id}::text = ${contextId}`)
          .limit(1);

        if (!scen) {
          throw new BankingError('SCENARIO_NOT_FOUND', `Strategy scenario ${contextId} does not exist.`, 404);
        }

        const cust = await resourceAuth.authorizeCustomer(user, scen.customerId, 'AGENT_CONTEXT_RESOLVE', requestId);
        targetCustomerId = cust.id;
        contextEntitySummary = `Strategy Simulator Scenario "${scen.name}" for customer ${cust.name}`;
        break;
      }

      case 'GROUP': {
        if (!contextId) {
          throw new BankingError('VALIDATION_ERROR', 'Group ID or Code is required for GROUP context.', 400);
        }
        const { groupService } = await import('../group.service.ts');
        const grp = await groupService.getGroup(contextId, user, requestId);
        targetCustomerId = grp.primaryCustomerId || null;
        contextEntitySummary = `Relationship Group 360 inspection for ${grp.displayName} (${grp.groupId})`;
        break;
      }

      case 'COMMAND_CENTER':
      case 'PORTFOLIO': {
        // High-level institutional oversight
        if (targetCustomerId) {
          const cust = await resourceAuth.authorizeCustomer(user, targetCustomerId, 'AGENT_CONTEXT_RESOLVE', requestId);
          targetCustomerId = cust.id;
          contextEntitySummary = `${contextType} view focused on customer ${cust.name}`;
        } else {
          contextEntitySummary = `${contextType} portfolio governance view for officer ${user.name} (${user.role})`;
        }
        break;
      }

      default:
        throw new BankingError('INVALID_CONTEXT', `Unsupported context type: ${contextType}`, 400);
    }

    // 2. Data Minimization: Load only key metrics if a customer is bound
    let customerCode: string | undefined;
    let customerName: string | undefined;
    let cifNumber: string | undefined;
    let availableSignalsCount = 0;
    let openCasesCount = 0;
    let stalledOpportunitiesCount = 0;
    let openTasksCount = 0;
    let recentScore = 75;
    let relationshipMomentum = 'STABLE';

    if (targetCustomerId) {
      const [customerRow] = await db
        .select({
          id: customers.id,
          customerCode: customers.customerCode,
          name: customers.name,
          cifNumber: customers.cifNumber,
          riskCategory: customers.riskCategory,
        })
        .from(customers)
        .where(eq(customers.id, targetCustomerId))
        .limit(1);

      if (customerRow) {
        customerCode = customerRow.customerCode;
        customerName = customerRow.name;
        cifNumber = customerRow.cifNumber;
      }

      // Check latest CORE score
      const [scoreRow] = await db
        .select({
          coreScore: customerScores.coreScore,
          financialHealthScore: customerScores.financialHealthScore,
          engagementScore: customerScores.engagementScore,
        })
        .from(customerScores)
        .where(eq(customerScores.customerId, targetCustomerId))
        .orderBy(desc(customerScores.createdAt))
        .limit(1);

      if (scoreRow) {
        recentScore = scoreRow.coreScore;
        relationshipMomentum = scoreRow.coreScore >= 75 ? 'POSITIVE' : (scoreRow.coreScore >= 50 ? 'NEUTRAL' : 'NEGATIVE');
      }

      // Count open cases
      const [caseCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(serviceCases)
        .where(and(eq(serviceCases.customerId, targetCustomerId), sql`${serviceCases.status} IN ('OPEN', 'IN_PROGRESS', 'ESCALATED')`));
      openCasesCount = Number(caseCount?.count || 0);

      // Count stalled / active opportunities
      const [oppCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(opportunities)
        .where(and(eq(opportunities.customerId, targetCustomerId), sql`${opportunities.stage} NOT IN ('WON', 'LOST')`));
      stalledOpportunitiesCount = Number(oppCount?.count || 0);

      // Count open tasks
      const [taskCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(and(eq(tasks.customerId, targetCustomerId), sql`${tasks.status} != 'COMPLETED'`));
      openTasksCount = Number(taskCount?.count || 0);

      // Signals count estimate based on open cases and momentum
      availableSignalsCount = openCasesCount + (relationshipMomentum === 'DECLINING' ? 2 : 1);
    }

    return {
      contextType,
      contextId: contextId || undefined,
      customerId: targetCustomerId || undefined,
      customerCode,
      customerName,
      cifNumber,
      resolvedAt: new Date().toISOString(),
      summary: contextEntitySummary,
      authorizedScope: user.role === 'ADMINISTRATOR' ? 'INSTITUTIONAL' : `RM_PORTFOLIO_${user.employeeId}`,
      availableSignalsCount,
      openCasesCount,
      stalledOpportunitiesCount,
      openTasksCount,
      recentScore,
      relationshipMomentum,
    };
  },
};
