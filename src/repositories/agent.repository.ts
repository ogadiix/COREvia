import { db } from '../db/index.ts';
import {
  agentSessions,
  agentPlans,
  agentPlanSteps,
  customers,
  users,
} from '../db/schema.ts';
import { eq, desc, and, or, sql, inArray } from 'drizzle-orm';
import {
  AgentSessionDTO,
  AgentPlanDTO,
  AgentPlanStepDTO,
  AgentSessionStatus,
  AgentPlanStatus,
} from '../types/agent.types.ts';

export class AgentRepository {
  /**
   * Create an agent session
   */
  async createSession(data: {
    sessionId: string;
    userId: number;
    customerId?: number | null;
    contextType: string;
    contextId?: string | null;
    status?: AgentSessionStatus;
    metadata?: Record<string, any>;
  }): Promise<AgentSessionDTO> {
    const [inserted] = await db
      .insert(agentSessions)
      .values({
        sessionId: data.sessionId,
        userId: data.userId,
        customerId: data.customerId ?? null,
        contextType: data.contextType,
        contextId: data.contextId ?? null,
        status: data.status || 'ACTIVE',
        metadata: data.metadata || {},
      })
      .returning();

    return this.mapSessionRow(inserted);
  }

  /**
   * Find session by DB ID or sessionId code (SES-...)
   */
  async findSessionById(idOrCode: number | string): Promise<AgentSessionDTO | null> {
    const query = typeof idOrCode === 'number'
      ? eq(agentSessions.id, idOrCode)
      : or(eq(agentSessions.sessionId, idOrCode), sql`${agentSessions.id}::text = ${idOrCode}`);

    const [row] = await db
      .select({
        session: agentSessions,
        user: { id: users.id, name: users.name },
        customer: { id: customers.id, name: customers.name, customerCode: customers.customerCode },
      })
      .from(agentSessions)
      .leftJoin(users, eq(agentSessions.userId, users.id))
      .leftJoin(customers, eq(agentSessions.customerId, customers.id))
      .where(query)
      .limit(1);

    if (!row) return null;

    const mapped = this.mapSessionRow(row.session);
    if (row.user) mapped.userName = row.user.name;
    if (row.customer) {
      mapped.customerCode = row.customer.customerCode;
      mapped.customerName = row.customer.name;
    }

    // Attach latest active plan if present
    const plans = await this.listPlansBySession(mapped.id);
    if (plans.length > 0) {
      mapped.activePlan = plans[0];
    }

    return mapped;
  }

  /**
   * Update session state
   */
  async updateSession(
    id: number,
    data: Partial<typeof agentSessions.$inferInsert>
  ): Promise<AgentSessionDTO | null> {
    const [updated] = await db
      .update(agentSessions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(agentSessions.id, id))
      .returning();

    return updated ? this.mapSessionRow(updated) : null;
  }

  /**
   * List sessions with optional filters
   */
  async listSessions(params: {
    userId?: number;
    customerId?: number;
    status?: AgentSessionStatus;
    limit?: number;
    offset?: number;
  }): Promise<AgentSessionDTO[]> {
    const conditions = [];
    if (params.userId) conditions.push(eq(agentSessions.userId, params.userId));
    if (params.customerId) conditions.push(eq(agentSessions.customerId, params.customerId));
    if (params.status) conditions.push(eq(agentSessions.status, params.status));

    const rows = await db
      .select({
        session: agentSessions,
        user: { id: users.id, name: users.name },
        customer: { id: customers.id, name: customers.name, customerCode: customers.customerCode },
      })
      .from(agentSessions)
      .leftJoin(users, eq(agentSessions.userId, users.id))
      .leftJoin(customers, eq(agentSessions.customerId, customers.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(agentSessions.createdAt))
      .limit(params.limit || 20)
      .offset(params.offset || 0);

    return rows.map((r) => {
      const mapped = this.mapSessionRow(r.session);
      if (r.user) mapped.userName = r.user.name;
      if (r.customer) {
        mapped.customerCode = r.customer.customerCode;
        mapped.customerName = r.customer.name;
      }
      return mapped;
    });
  }

  /**
   * Create an agent plan and its steps transactionally
   */
  async createPlan(
    planData: {
      planId: string;
      sessionId: number;
      customerId?: number | null;
      title: string;
      objective: string;
      status?: AgentPlanStatus;
      planVersion?: number;
      decisionTraceId?: string | null;
      scenarioId?: string | null;
      estimatedEffect?: string | null;
      planRationale?: string | null;
      expiresAt?: Date | null;
    },
    stepsData: Array<{
      stepNumber: number;
      actionType: string;
      targetEntityType?: string;
      targetEntityId?: string;
      parameters?: Record<string, any>;
      rationale: string;
      requiredPermission?: string;
      status?: string;
      requiresConfirmation?: boolean;
      dependsOnStepNumber?: number | null;
      dependencyPolicy?: string;
      idempotencyKey?: string;
    }>
  ): Promise<AgentPlanDTO> {
    return await db.transaction(async (tx) => {
      const [insertedPlan] = await tx
        .insert(agentPlans)
        .values({
          planId: planData.planId,
          sessionId: planData.sessionId,
          customerId: planData.customerId ?? null,
          title: planData.title,
          objective: planData.objective,
          status: planData.status || 'DRAFT',
          planVersion: planData.planVersion || 1,
          decisionTraceId: planData.decisionTraceId ?? null,
          scenarioId: planData.scenarioId ?? null,
          estimatedEffect: planData.estimatedEffect ?? null,
          planRationale: planData.planRationale ?? null,
          expiresAt: planData.expiresAt ?? null,
        })
        .returning();

      let insertedSteps: any[] = [];
      if (stepsData.length > 0) {
        insertedSteps = await tx
          .insert(agentPlanSteps)
          .values(
            stepsData.map((s) => ({
              planId: insertedPlan.id,
              stepNumber: s.stepNumber,
              actionType: s.actionType,
              targetEntityType: s.targetEntityType ?? null,
              targetEntityId: s.targetEntityId ?? null,
              parameters: s.parameters ?? {},
              rationale: s.rationale,
              requiredPermission: s.requiredPermission || 'customers:read',
              status: s.status || 'PENDING',
              requiresConfirmation: s.requiresConfirmation ?? true,
              dependsOnStepNumber: s.dependsOnStepNumber ?? null,
              dependencyPolicy: s.dependencyPolicy || 'SKIP',
              idempotencyKey: s.idempotencyKey ?? null,
            }))
          )
          .returning();
      }

      const planDto = this.mapPlanRow(insertedPlan);
      planDto.steps = insertedSteps.map(this.mapStepRow);
      return planDto;
    });
  }

  /**
   * Find plan by ID or planId code (PLN-...)
   */
  async findPlanById(idOrCode: number | string): Promise<AgentPlanDTO | null> {
    const query = typeof idOrCode === 'number'
      ? eq(agentPlans.id, idOrCode)
      : or(eq(agentPlans.planId, idOrCode), sql`${agentPlans.id}::text = ${idOrCode}`);

    const [row] = await db
      .select({
        plan: agentPlans,
        session: { sessionId: agentSessions.sessionId },
        customer: { id: customers.id, name: customers.name, customerCode: customers.customerCode },
        approver: { id: users.id, name: users.name },
      })
      .from(agentPlans)
      .leftJoin(agentSessions, eq(agentPlans.sessionId, agentSessions.id))
      .leftJoin(customers, eq(agentPlans.customerId, customers.id))
      .leftJoin(users, eq(agentPlans.approvedBy, users.id))
      .where(query)
      .limit(1);

    if (!row) return null;

    const steps = await db
      .select()
      .from(agentPlanSteps)
      .where(eq(agentPlanSteps.planId, row.plan.id))
      .orderBy(agentPlanSteps.stepNumber);

    const mapped = this.mapPlanRow(row.plan);
    if (row.session) mapped.sessionCode = row.session.sessionId;
    if (row.customer) {
      mapped.customerCode = row.customer.customerCode;
      mapped.customerName = row.customer.name;
    }
    if (row.approver) mapped.approvedByName = row.approver.name;
    mapped.steps = steps.map(this.mapStepRow);

    return mapped;
  }

  /**
   * Update plan attributes
   */
  async updatePlan(
    id: number,
    data: Partial<typeof agentPlans.$inferInsert>
  ): Promise<AgentPlanDTO | null> {
    const [updated] = await db
      .update(agentPlans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(agentPlans.id, id))
      .returning();

    if (!updated) return null;
    return this.findPlanById(updated.id);
  }

  /**
   * Update single plan step execution state
   */
  async updateStep(
    stepId: number,
    data: Partial<typeof agentPlanSteps.$inferInsert>
  ): Promise<AgentPlanStepDTO | null> {
    const [updated] = await db
      .update(agentPlanSteps)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(agentPlanSteps.id, stepId))
      .returning();

    return updated ? this.mapStepRow(updated) : null;
  }

  /**
   * Find completed step by idempotency key to prevent duplication
   */
  async findStepByIdempotency(idempotencyKey: string): Promise<AgentPlanStepDTO | null> {
    if (!idempotencyKey) return null;

    const [row] = await db
      .select()
      .from(agentPlanSteps)
      .where(and(eq(agentPlanSteps.idempotencyKey, idempotencyKey), eq(agentPlanSteps.status, 'COMPLETED')))
      .limit(1);

    return row ? this.mapStepRow(row) : null;
  }

  /**
   * List plans by session ID
   */
  async listPlansBySession(sessionId: number): Promise<AgentPlanDTO[]> {
    const rows = await db
      .select()
      .from(agentPlans)
      .where(eq(agentPlans.sessionId, sessionId))
      .orderBy(desc(agentPlans.createdAt));

    const result: AgentPlanDTO[] = [];
    for (const r of rows) {
      const steps = await db
        .select()
        .from(agentPlanSteps)
        .where(eq(agentPlanSteps.planId, r.id))
        .orderBy(agentPlanSteps.stepNumber);

      const dto = this.mapPlanRow(r);
      dto.steps = steps.map(this.mapStepRow);
      result.push(dto);
    }
    return result;
  }

  /**
   * List plans by customer ID
   */
  async listPlansByCustomer(customerId: number, limit = 20): Promise<AgentPlanDTO[]> {
    const rows = await db
      .select()
      .from(agentPlans)
      .where(eq(agentPlans.customerId, customerId))
      .orderBy(desc(agentPlans.createdAt))
      .limit(limit);

    const result: AgentPlanDTO[] = [];
    for (const r of rows) {
      const steps = await db
        .select()
        .from(agentPlanSteps)
        .where(eq(agentPlanSteps.planId, r.id))
        .orderBy(agentPlanSteps.stepNumber);

      const dto = this.mapPlanRow(r);
      dto.steps = steps.map(this.mapStepRow);
      result.push(dto);
    }
    return result;
  }

  /**
   * Aggregated metrics for controlled banking agent
   */
  async getAgentAnalytics() {
    const [sessionsCount] = await db.select({ count: sql<number>`count(*)` }).from(agentSessions);
    const [plansCount] = await db.select({ count: sql<number>`count(*)` }).from(agentPlans);
    const [executedStepsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(agentPlanSteps)
      .where(eq(agentPlanSteps.status, 'COMPLETED'));

    const [approvedPlansCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(agentPlans)
      .where(or(eq(agentPlans.status, 'APPROVED'), eq(agentPlans.status, 'COMPLETED')));

    return {
      totalSessions: Number(sessionsCount?.count || 0),
      totalPlans: Number(plansCount?.count || 0),
      approvedPlans: Number(approvedPlansCount?.count || 0),
      executedSteps: Number(executedStepsCount?.count || 0),
    };
  }

  private mapSessionRow(row: typeof agentSessions.$inferSelect): AgentSessionDTO {
    return {
      id: row.id,
      sessionId: row.sessionId,
      userId: row.userId,
      customerId: row.customerId,
      contextType: row.contextType as any,
      contextId: row.contextId,
      status: row.status as any,
      startedAt: row.startedAt.toISOString(),
      endedAt: row.endedAt ? row.endedAt.toISOString() : undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapPlanRow(row: typeof agentPlans.$inferSelect): AgentPlanDTO {
    return {
      id: row.id,
      planId: row.planId,
      sessionId: row.sessionId,
      customerId: row.customerId,
      title: row.title,
      objective: row.objective,
      status: row.status as any,
      planVersion: row.planVersion,
      decisionTraceId: row.decisionTraceId,
      scenarioId: row.scenarioId,
      estimatedEffect: row.estimatedEffect,
      planRationale: row.planRationale,
      rejectionReason: row.rejectionReason,
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : undefined,
      approvedAt: row.approvedAt ? row.approvedAt.toISOString() : undefined,
      approvedBy: row.approvedBy,
      completedAt: row.completedAt ? row.completedAt.toISOString() : undefined,
      steps: [],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapStepRow(row: typeof agentPlanSteps.$inferSelect): AgentPlanStepDTO {
    return {
      id: row.id,
      planId: row.planId,
      stepNumber: row.stepNumber,
      actionType: row.actionType as any,
      targetEntityType: row.targetEntityType ?? undefined,
      targetEntityId: row.targetEntityId ?? undefined,
      parameters: (row.parameters as Record<string, any>) || {},
      rationale: row.rationale,
      requiredPermission: row.requiredPermission,
      status: row.status as any,
      requiresConfirmation: row.requiresConfirmation,
      dependsOnStepNumber: row.dependsOnStepNumber,
      dependencyPolicy: (row.dependencyPolicy as any) || 'SKIP',
      idempotencyKey: row.idempotencyKey ?? undefined,
      startedAt: row.startedAt ? row.startedAt.toISOString() : undefined,
      completedAt: row.completedAt ? row.completedAt.toISOString() : undefined,
      errorCode: row.errorCode ?? undefined,
      errorMessage: row.errorMessage ?? undefined,
      resultSummary: row.resultSummary ?? undefined,
      auditLogId: row.auditLogId ?? undefined,
      verifiedAt: row.verifiedAt ? row.verifiedAt.toISOString() : undefined,
    };
  }
}

export const agentRepository = new AgentRepository();
