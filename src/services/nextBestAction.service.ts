import { eq, and, desc, sql, ilike, or, inArray, notInArray } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  nextBestActions,
  nextBestActionEvidence,
  customers,
  auditLogs,
  users,
  tasks,
  opportunities,
  serviceCases,
  customerScores,
  customerOpportunityRadar,
} from '../db/schema.ts';
import { customerRepository } from '../repositories/customer.repository.ts';
import { taskService } from './task.service.ts';
import type {
  NextBestAction,
  ActionEvidence,
  ActionPriority,
  ActionStatus,
  ActionType,
  ActionUrgency,
  DailyRelationshipBrief,
} from '../types/index.ts';
import { evaluateNextBestActions } from './nextBestActionRules.ts';
import { BankingError } from '../lib/errors.ts';

export interface ListNBAParams {
  customerId?: number;
  assignedRmId?: number;
  actionType?: string;
  priority?: string;
  urgency?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SafeActor {
  id?: number;
  employeeId?: string;
  name?: string;
  email?: string;
  requestId?: string;
}

export const nextBestActionService = {
  /**
   * Deterministically evaluate Next Best Actions for a specific customer
   */
  async evaluateCustomer(customerId: number, actorContext?: SafeActor): Promise<NextBestAction[]> {
    const bundle = await customerRepository.getCustomer360(customerId);
    if (!bundle || !bundle.customer) {
      throw new BankingError(`Customer not found with ID ${customerId}`, 'CUSTOMER_NOT_FOUND', 404);
    }

    // Fetch existing radar signals for customer
    const radarSignals = await db
      .select()
      .from(customerOpportunityRadar)
      .where(eq(customerOpportunityRadar.customerId, customerId));

    // 1. Run deterministic rules against verified CRM records
    const candidates = evaluateNextBestActions({
      ...bundle,
      radarSignals,
    });

    // 2. Fetch existing actions for this customer
    const existingRows = await db
      .select()
      .from(nextBestActions)
      .where(eq(nextBestActions.customerId, customerId));

    const existingMap = new Map<string, typeof existingRows[0]>();
    existingRows.forEach((row) => {
      existingMap.set(row.dedupKey, row);
    });

    const activeCandidateKeys = new Set<string>();
    const now = new Date();

    // 3. Upsert candidate actions
    for (let i = 0; i < candidates.length; i++) {
      const cand = candidates[i];
      activeCandidateKeys.add(cand.dedupKey);
      const isTop = i === 0; // Rank #1 candidate is top recommendation

      const existing = existingMap.get(cand.dedupKey);

      if (!existing) {
        // Insert new action
        const [newAction] = await db
          .insert(nextBestActions)
          .values({
            actionId: cand.actionId,
            customerId: cand.customerId,
            actionType: cand.actionType,
            category: cand.category,
            title: cand.title,
            description: cand.description,
            priority: cand.priority,
            urgency: cand.urgency,
            rationale: cand.rationale,
            expectedImpact: cand.expectedImpact,
            confidence: cand.confidence,
            confidenceScore: String(cand.confidenceScore),
            rankScore: String(cand.rankScore),
            isTopRecommendation: isTop,
            status: 'ACTIVE',
            ruleId: cand.ruleId,
            ruleVersion: cand.ruleVersion,
            sourceEntityType: cand.sourceEntityType,
            sourceEntityId: cand.sourceEntityId,
            sourceEntityCode: cand.sourceEntityCode || null,
            evidence: JSON.stringify(cand.evidence),
            actionRoute: cand.actionRoute,
            targetEntityContext: cand.targetEntityContext || null,
            dedupKey: cand.dedupKey,
          })
          .returning();

        // Insert normalized evidence records
        if (cand.evidence && cand.evidence.length > 0) {
          const evidenceRows = cand.evidence.map((ev) => ({
            actionId: newAction.id,
            sourceEntityType: String(ev.sourceEntityType),
            sourceEntityId: String(ev.sourceEntityId),
            sourceEntityCode: ev.sourceEntityCode || '',
            recordTitle: ev.recordTitle || '',
            evidenceType: ev.evidenceType || 'RECORD',
            evidenceSummary: ev.evidenceSummary || '',
            detail: ev.detail || null,
            routePath: ev.routePath || null,
            metricValue: ev.metricValue != null ? String(ev.metricValue) : null,
            timestamp: ev.timestamp ? new Date(ev.timestamp) : null,
          }));

          await db.insert(nextBestActionEvidence).values(evidenceRows);
        }
      } else if (existing.status === 'ACTIVE') {
        // Update rank, urgency, and top recommendation flag for active action
        await db
          .update(nextBestActions)
          .set({
            rankScore: String(cand.rankScore),
            priority: cand.priority,
            urgency: cand.urgency,
            description: cand.description,
            isTopRecommendation: isTop,
            evidence: JSON.stringify(cand.evidence),
            updatedAt: now,
          })
          .where(eq(nextBestActions.id, existing.id));
      }
    }

    // 4. Clean lifecycle transition: Mark active actions that are no longer triggered as EXPIRED
    for (const existing of existingRows) {
      if (existing.status === 'ACTIVE' && !activeCandidateKeys.has(existing.dedupKey)) {
        await db
          .update(nextBestActions)
          .set({
            status: 'EXPIRED',
            updatedAt: now,
          })
          .where(eq(nextBestActions.id, existing.id));
      }
    }

    // 5. Audit log generation event
    if (actorContext?.name) {
      await db.insert(auditLogs).values({
        actorId: actorContext.employeeId || String(actorContext.id || 'SYSTEM'),
        actorName: actorContext.name,
        action: 'NBA_EVALUATED',
        resourceType: 'CUSTOMER_NBA',
        resourceId: String(customerId),
        requestId: actorContext.requestId || `REQ-NBA-EVAL-${Date.now()}`,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({
          customerId,
          generatedCount: candidates.length,
          topRecommendation: candidates[0]?.title || 'None',
        }),
      });
    }

    // 6. Return refreshed active actions for this customer
    return await this.getCustomerActions(customerId);
  },

  /**
   * Retrieve active Next Best Actions for a customer
   */
  async getCustomerActions(customerId: number): Promise<NextBestAction[]> {
    const rows = await db
      .select({
        action: nextBestActions,
        customer: customers,
      })
      .from(nextBestActions)
      .innerJoin(customers, eq(nextBestActions.customerId, customers.id))
      .where(
        and(
          eq(nextBestActions.customerId, customerId),
          eq(nextBestActions.status, 'ACTIVE')
        )
      )
      .orderBy(desc(sql`CAST(${nextBestActions.rankScore} AS NUMERIC)`));

    if (rows.length === 0) {
      // Check if we need to auto-evaluate for first time access
      const allRows = await db
        .select()
        .from(nextBestActions)
        .where(eq(nextBestActions.customerId, customerId))
        .limit(1);

      if (allRows.length === 0) {
        // Run auto evaluation once
        return await this.evaluateCustomer(customerId);
      }
    }

    return rows.map((r) => this.mapActionRow(r.action, r.customer));
  },

  /**
   * List Next Best Actions with rich filtering across RM or Branch portfolio
   */
  async listActions(params: ListNBAParams = {}) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    const conditions = [];

    if (params.customerId) {
      conditions.push(eq(nextBestActions.customerId, params.customerId));
    }

    if (params.assignedRmId) {
      conditions.push(eq(customers.assignedRmId, params.assignedRmId));
    }

    if (params.status) {
      conditions.push(eq(nextBestActions.status, params.status));
    } else {
      // Default to ACTIVE
      conditions.push(eq(nextBestActions.status, 'ACTIVE'));
    }

    if (params.actionType) {
      conditions.push(eq(nextBestActions.actionType, params.actionType));
    }

    if (params.priority) {
      conditions.push(eq(nextBestActions.priority, params.priority));
    }

    if (params.urgency) {
      conditions.push(eq(nextBestActions.urgency, params.urgency));
    }

    if (params.search && params.search.trim()) {
      const term = `%${params.search.trim()}%`;
      conditions.push(
        or(
          ilike(nextBestActions.title, term),
          ilike(nextBestActions.description, term),
          ilike(customers.name, term),
          ilike(customers.customerCode, term),
          ilike(customers.cifNumber, term)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total Count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(nextBestActions)
      .innerJoin(customers, eq(nextBestActions.customerId, customers.id))
      .where(whereClause);

    const total = Number(countResult?.count || 0);

    // Records
    const rows = await db
      .select({
        action: nextBestActions,
        customer: customers,
      })
      .from(nextBestActions)
      .innerJoin(customers, eq(nextBestActions.customerId, customers.id))
      .where(whereClause)
      .orderBy(desc(sql`CAST(${nextBestActions.rankScore} AS NUMERIC)`))
      .limit(limit)
      .offset(offset);

    const data = rows.map((r) => this.mapActionRow(r.action, r.customer));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Retrieve a single Next Best Action with normalized evidence records
   */
  async getActionById(id: number): Promise<NextBestAction> {
    const [row] = await db
      .select({
        action: nextBestActions,
        customer: customers,
      })
      .from(nextBestActions)
      .innerJoin(customers, eq(nextBestActions.customerId, customers.id))
      .where(eq(nextBestActions.id, id))
      .limit(1);

    if (!row) {
      throw new BankingError(`Next Best Action #${id} not found`, 'ACTION_NOT_FOUND', 404);
    }

    const evidenceRows = await db
      .select()
      .from(nextBestActionEvidence)
      .where(eq(nextBestActionEvidence.actionId, id))
      .orderBy(desc(nextBestActionEvidence.createdAt));

    const action = this.mapActionRow(row.action, row.customer);
    if (evidenceRows.length > 0) {
      action.evidence = evidenceRows.map((ev) => ({
        id: ev.id,
        sourceEntityType: ev.sourceEntityType,
        sourceEntityId: ev.sourceEntityId,
        sourceEntityCode: ev.sourceEntityCode,
        recordTitle: ev.recordTitle,
        evidenceType: ev.evidenceType,
        evidenceSummary: ev.evidenceSummary,
        detail: ev.detail || '',
        routePath: ev.routePath || undefined,
        metricValue: ev.metricValue || undefined,
        timestamp: ev.timestamp ? ev.timestamp.toISOString() : undefined,
      }));
    }

    return action;
  },

  /**
   * Officer accepts a recommendation
   */
  async acceptAction(id: number, actorContext: SafeActor): Promise<NextBestAction> {
    const [action] = await db.select().from(nextBestActions).where(eq(nextBestActions.id, id));
    if (!action) {
      throw new BankingError(`Next Best Action #${id} not found`, 'ACTION_NOT_FOUND', 404);
    }

    if (action.status !== 'ACTIVE') {
      throw new BankingError(`Cannot accept action with status '${action.status}'`, 'INVALID_ACTION_STATUS', 400);
    }

    const now = new Date();
    const [updated] = await db
      .update(nextBestActions)
      .set({
        status: 'ACCEPTED',
        acceptedById: actorContext.id || null,
        acceptedByName: actorContext.name || null,
        acceptedAt: now,
        updatedAt: now,
      })
      .where(eq(nextBestActions.id, id))
      .returning();

    // Audit Log
    await db.insert(auditLogs).values({
      actorId: actorContext.employeeId || String(actorContext.id || 'UNKNOWN'),
      actorName: actorContext.name || 'Officer',
      action: 'NBA_ACCEPTED',
      resourceType: 'NEXT_BEST_ACTION',
      resourceId: String(id),
      requestId: actorContext.requestId || `REQ-NBA-ACCEPT-${Date.now()}`,
      outcome: 'SUCCESS',
      metadata: JSON.stringify({
        actionId: action.actionId,
        title: action.title,
        customerId: action.customerId,
        ruleId: action.ruleId,
      }),
    });

    return await this.getActionById(id);
  },

  /**
   * Officer dismisses a recommendation with mandatory reason
   */
  async dismissAction(id: number, actorContext: SafeActor, reason: string): Promise<NextBestAction> {
    if (!reason || reason.trim().length < 3) {
      throw new BankingError('A valid explanation is required to dismiss a recommendation', 'VALIDATION_ERROR', 400);
    }

    const [action] = await db.select().from(nextBestActions).where(eq(nextBestActions.id, id));
    if (!action) {
      throw new BankingError(`Next Best Action #${id} not found`, 'ACTION_NOT_FOUND', 404);
    }

    if (action.status !== 'ACTIVE') {
      throw new BankingError(`Cannot dismiss action with status '${action.status}'`, 'INVALID_ACTION_STATUS', 400);
    }

    const now = new Date();
    const [updated] = await db
      .update(nextBestActions)
      .set({
        status: 'DISMISSED',
        dismissedReason: reason.trim(),
        dismissedById: actorContext.id || null,
        dismissedByName: actorContext.name || null,
        dismissedAt: now,
        updatedAt: now,
      })
      .where(eq(nextBestActions.id, id))
      .returning();

    // Audit Log
    await db.insert(auditLogs).values({
      actorId: actorContext.employeeId || String(actorContext.id || 'UNKNOWN'),
      actorName: actorContext.name || 'Officer',
      action: 'NBA_DISMISSED',
      resourceType: 'NEXT_BEST_ACTION',
      resourceId: String(id),
      requestId: actorContext.requestId || `REQ-NBA-DISMISS-${Date.now()}`,
      outcome: 'SUCCESS',
      metadata: JSON.stringify({
        actionId: action.actionId,
        title: action.title,
        customerId: action.customerId,
        reason: reason.trim(),
      }),
    });

    return await this.getActionById(id);
  },

  /**
   * Convert Next Best Action directly into an institutional Task
   */
  async createTaskFromAction(
    id: number,
    actorContext: SafeActor & { requestId?: string },
    taskOverrides?: {
      title?: string;
      dueDate?: string;
      priority?: string;
      description?: string;
      assignedToId?: number;
    }
  ): Promise<{ action: NextBestAction; task: any }> {
    const [action] = await db.select().from(nextBestActions).where(eq(nextBestActions.id, id));
    if (!action) {
      throw new BankingError(`Next Best Action #${id} not found`, 'ACTION_NOT_FOUND', 404);
    }

    if (action.createdTaskId) {
      throw new BankingError(`Task #${action.createdTaskId} is already linked to this action`, 'TASK_ALREADY_EXISTS', 400);
    }

    // Determine due date (Default based on urgency)
    const dueDate =
      taskOverrides?.dueDate ||
      (action.urgency === 'IMMEDIATE'
        ? new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0]
        : action.urgency === 'TODAY'
        ? new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0]
        : new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0]);

    // Map priority
    const priority =
      taskOverrides?.priority ||
      (action.priority === 'CRITICAL' ? 'CRITICAL' : action.priority === 'HIGH' ? 'HIGH' : 'MEDIUM');

    // Create task using canonical taskService
    const createdTask = await taskService.createTask(
      {
        customerId: action.customerId,
        title: taskOverrides?.title || action.title,
        description:
          taskOverrides?.description ||
          `[Generated from Next Best Action: ${action.actionId}]\n\nRecommendation: ${action.title}\nRationale: ${action.rationale}\nExpected Impact: ${action.expectedImpact}`,
        priority,
        dueDate,
        assignedToId: taskOverrides?.assignedToId || actorContext.id,
        relatedType: action.sourceEntityType === 'CASE' ? 'CASE' : action.sourceEntityType === 'OPPORTUNITY' ? 'OPPORTUNITY' : 'CUSTOMER',
        relatedId: action.sourceEntityId ? String(action.sourceEntityId) : undefined,
      },
      {
        actorId: actorContext.employeeId || String(actorContext.id || 'OFFICER'),
        actorName: actorContext.name || 'Relationship Manager',
        requestId: actorContext.requestId || `REQ-NBA-TASK-${Date.now()}`,
      }
    );

    // Update Action status and link to Task
    const now = new Date();
    await db
      .update(nextBestActions)
      .set({
        status: 'ACCEPTED',
        createdTaskId: createdTask.id,
        acceptedById: actorContext.id || null,
        acceptedByName: actorContext.name || null,
        acceptedAt: now,
        updatedAt: now,
      })
      .where(eq(nextBestActions.id, id));

    // Audit Log
    await db.insert(auditLogs).values({
      actorId: actorContext.employeeId || String(actorContext.id || 'UNKNOWN'),
      actorName: actorContext.name || 'Officer',
      action: 'NBA_TASK_CREATED',
      resourceType: 'NEXT_BEST_ACTION',
      resourceId: String(id),
      requestId: actorContext.requestId || `REQ-NBA-TASK-LOG-${Date.now()}`,
      outcome: 'SUCCESS',
      metadata: JSON.stringify({
        actionId: action.actionId,
        taskId: createdTask.id,
        taskTitle: createdTask.title,
      }),
    });

    const refreshedAction = await this.getActionById(id);
    return {
      action: refreshedAction,
      task: createdTask,
    };
  },

  /**
   * Daily Relationship Brief for logged-in RM (Section 26)
   * Deterministic operational briefing across:
   * - Act Now (Critical / High actions)
   * - Follow Up (Customer actions due today or overdue follow-ups)
   * - Watch (Customers with deteriorating health or score warning)
   * - Opportunities (High-priority opportunities closing soon)
   */
  async getDailyRelationshipBrief(assignedRmId?: number): Promise<DailyRelationshipBrief> {
    const now = new Date();

    // Query active actions
    const actionConditions = [eq(nextBestActions.status, 'ACTIVE')];
    if (assignedRmId) {
      actionConditions.push(eq(customers.assignedRmId, assignedRmId));
    }

    const actionRows = await db
      .select({
        action: nextBestActions,
        customer: customers,
      })
      .from(nextBestActions)
      .innerJoin(customers, eq(nextBestActions.customerId, customers.id))
      .where(and(...actionConditions))
      .orderBy(desc(sql`CAST(${nextBestActions.rankScore} AS NUMERIC)`))
      .limit(50);

    if (actionRows.length === 0) {
      // Auto-evaluate on first access so brief is immediately populated
      await this.recalculateAll({ name: 'System Auto-Initializer' });
      // Re-query
      const refreshedRows = await db
        .select({
          action: nextBestActions,
          customer: customers,
        })
        .from(nextBestActions)
        .innerJoin(customers, eq(nextBestActions.customerId, customers.id))
        .where(and(...actionConditions))
        .orderBy(desc(sql`CAST(${nextBestActions.rankScore} AS NUMERIC)`))
        .limit(50);
      actionRows.push(...refreshedRows);
    }

    const allActions = actionRows.map((r) => this.mapActionRow(r.action, r.customer));

    // 1. Act Now: Actions with CRITICAL priority OR IMMEDIATE urgency
    const actNow = allActions.filter(
      (a) => a.priority === 'CRITICAL' || a.urgency === 'IMMEDIATE'
    );

    // 2. Follow Up: Actions with TODAY urgency OR task-related actions
    const followUp = allActions.filter(
      (a) =>
        !actNow.some((an) => an.id === a.id) &&
        (a.urgency === 'TODAY' || a.actionType === 'TASK' || a.category === 'OVERDUE_FOLLOWUP')
    );

    // 3. Watch Customers: Deteriorating relationship health / CORE score < 60
    const watchListRows = await db
      .select({
        customer: customers,
        score: customerScores,
      })
      .from(customers)
      .leftJoin(customerScores, eq(customers.id, customerScores.customerId))
      .where(
        assignedRmId ? eq(customers.assignedRmId, assignedRmId) : undefined
      )
      .limit(100);

    const watch = watchListRows
      .filter((r) => {
        const score = r.score ? Number(r.score.coreScore || 0) : 100;
        return score < 60 || r.customer.riskCategory === 'HIGH';
      })
      .slice(0, 5)
      .map((r) => {
        const topAction = allActions.find((a) => a.customerId === r.customer.id);
        const scoreVal = r.score ? Number(r.score.coreScore || 0) : 55;
        const band =
          scoreVal >= 80 ? 'PLATINUM' : scoreVal >= 65 ? 'GROWTH' : scoreVal >= 50 ? 'WATCHLIST' : 'CRITICAL_RISK';
        const reasons: string[] = [];

        if (scoreVal < 60) reasons.push(`CORE Score degraded (${scoreVal}/100)`);
        if (r.score && Number(r.score.financialHealthScore || 100) < 50) reasons.push('Financial health stress');
        if (r.score && Number(r.score.engagementScore || 100) < 50) reasons.push('Low touchpoints');
        if (r.customer.riskCategory === 'HIGH') reasons.push('High AML/KYC risk profile');

        return {
          customerId: r.customer.id,
          customerName: r.customer.name,
          customerCode: r.customer.customerCode,
          cifNumber: r.customer.cifNumber,
          coreScore: scoreVal,
          relationshipBand: band,
          reasons: reasons.length > 0 ? reasons : ['Relationship health monitoring'],
          topAction,
        };
      });

    // 4. Opportunities: Open opportunities not in WON or LOST
    const oppConditions = [notInArray(opportunities.stage, ['WON', 'LOST'])];
    if (assignedRmId) {
      oppConditions.push(eq(opportunities.assignedToId, assignedRmId));
    }

    const oppRows = await db
      .select({
        opp: opportunities,
        customer: customers,
      })
      .from(opportunities)
      .innerJoin(customers, eq(opportunities.customerId, customers.id))
      .where(and(...oppConditions))
      .orderBy(desc(opportunities.expectedValue))
      .limit(6);

    const oppsList = oppRows.map((r) => {
      const oppAction = allActions.find(
        (a) => a.sourceEntityType === 'OPPORTUNITY' && String(a.sourceEntityId) === String(r.opp.id)
      );

      return {
        opportunityId: r.opp.id,
        opportunityCode: r.opp.opportunityCode,
        title: r.opp.title,
        customerId: r.customer.id,
        customerName: r.customer.name,
        expectedValue: Number(r.opp.expectedValue || 0),
        probability: Number(r.opp.probability || 0),
        stage: r.opp.stage,
        expectedCloseDate: r.opp.expectedCloseDate ? String(r.opp.expectedCloseDate) : 'Open',
        action: oppAction,
      };
    });

    // Summary statistics
    const criticalActions = allActions.filter((a) => a.priority === 'CRITICAL').length;
    const serviceFirstAlerts = allActions.filter((a) => a.actionType === 'SERVICE').length;
    const immediateUrgencyCount = allActions.filter((a) => a.urgency === 'IMMEDIATE').length;

    return {
      actNow,
      followUp,
      watch,
      opportunities: oppsList,
      summaryStats: {
        totalActiveActions: allActions.length,
        criticalActions,
        serviceFirstAlerts,
        immediateUrgencyCount,
      },
    };
  },

  /**
   * Batch recalculation across all active customers
   */
  async recalculateAll(actorContext?: SafeActor): Promise<{ evaluated: number; totalActive: number }> {
    const allCustomers = await db.select({ id: customers.id }).from(customers);
    let evaluated = 0;

    for (const c of allCustomers) {
      await this.evaluateCustomer(c.id);
      evaluated++;
    }

    const [activeCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(nextBestActions)
      .where(eq(nextBestActions.status, 'ACTIVE'));

    const totalActive = Number(activeCount?.count || 0);

    if (actorContext?.name) {
      await db.insert(auditLogs).values({
        actorId: actorContext.employeeId || String(actorContext.id || 'SYSTEM'),
        actorName: actorContext.name,
        action: 'NBA_BATCH_RECALCULATED',
        resourceType: 'SYSTEM_NBA',
        resourceId: 'ALL',
        requestId: actorContext.requestId || `REQ-NBA-BATCH-${Date.now()}`,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({ evaluatedCustomers: evaluated, totalActiveActions: totalActive }),
      });
    }

    return { evaluated, totalActive };
  },

  /**
   * Internal mapper to produce typed NextBestAction object
   */
  mapActionRow(action: any, customer?: any): NextBestAction {
    let parsedEvidence: ActionEvidence[] = [];
    try {
      if (typeof action.evidence === 'string') {
        parsedEvidence = JSON.parse(action.evidence);
      } else if (Array.isArray(action.evidence)) {
        parsedEvidence = action.evidence;
      }
    } catch {
      parsedEvidence = [];
    }

    return {
      id: action.id,
      actionId: action.actionId,
      customerId: action.customerId,
      customerName: customer?.name || undefined,
      customerCode: customer?.customerCode || undefined,
      cifNumber: customer?.cifNumber || undefined,
      assignedRmId: customer?.assignedRmId || null,
      actionType: action.actionType as ActionType,
      category: action.category,
      title: action.title,
      description: action.description,
      priority: action.priority as ActionPriority,
      urgency: action.urgency as ActionUrgency,
      rationale: action.rationale,
      expectedImpact: action.expectedImpact,
      confidence: action.confidence as 'HIGH' | 'MEDIUM' | 'LOW',
      confidenceScore: Number(action.confidenceScore || 0.9),
      rankScore: Number(action.rankScore || 0),
      isTopRecommendation: Boolean(action.isTopRecommendation),
      status: action.status as ActionStatus,
      ruleId: action.ruleId,
      ruleVersion: action.ruleVersion,
      sourceEntityType: action.sourceEntityType,
      sourceEntityId: action.sourceEntityId,
      sourceEntityCode: action.sourceEntityCode,
      evidence: parsedEvidence,
      actionRoute: action.actionRoute,
      targetEntityContext: action.targetEntityContext,
      dismissedReason: action.dismissedReason,
      dismissedById: action.dismissedById,
      dismissedByName: action.dismissedByName,
      dismissedAt: action.dismissedAt ? action.dismissedAt.toISOString() : null,
      acceptedById: action.acceptedById,
      acceptedByName: action.acceptedByName,
      acceptedAt: action.acceptedAt ? action.acceptedAt.toISOString() : null,
      completedAt: action.completedAt ? action.completedAt.toISOString() : null,
      createdTaskId: action.createdTaskId,
      generatedAt: action.generatedAt ? action.generatedAt.toISOString() : new Date().toISOString(),
      expiresAt: action.expiresAt ? action.expiresAt.toISOString() : null,
      dedupKey: action.dedupKey,
      createdAt: action.createdAt ? action.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: action.updatedAt ? action.updatedAt.toISOString() : new Date().toISOString(),
    };
  },
};
