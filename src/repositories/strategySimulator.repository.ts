import { db } from '../db';
import {
  relationshipScenarios,
  relationshipScenarioActions,
  customers,
  users,
} from '../db/schema';
import { eq, desc, and, inArray, ilike, or, sql } from 'drizzle-orm';
import {
  StrategyScenarioDTO,
  ScenarioActionItem,
  StrategyAnalyticsSummaryDTO,
} from '../types/strategySimulator.types';

export class StrategySimulatorRepository {
  /**
   * Transactionally create a new scenario with its ordered actions
   */
  async createScenario(
    data: {
      scenarioId: string;
      customerId: number;
      createdBy: number;
      name: string;
      description?: string;
      status?: 'DRAFT' | 'SIMULATED' | 'SAVED' | 'ARCHIVED';
      baseSnapshot: any;
      resultSnapshot?: any;
      comparisonDelta?: any;
      decisionTraceId?: string;
    },
    actions: ScenarioActionItem[] = []
  ): Promise<StrategyScenarioDTO> {
    return await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(relationshipScenarios)
        .values({
          scenarioId: data.scenarioId,
          customerId: data.customerId,
          createdBy: data.createdBy,
          name: data.name,
          description: data.description || null,
          status: data.status || 'DRAFT',
          baseSnapshot: data.baseSnapshot,
          resultSnapshot: data.resultSnapshot || null,
          comparisonDelta: data.comparisonDelta || null,
          decisionTraceId: data.decisionTraceId || null,
        })
        .returning();

      let insertedActions: any[] = [];
      if (actions.length > 0) {
        insertedActions = await tx
          .insert(relationshipScenarioActions)
          .values(
            actions.map((act, idx) => ({
              scenarioId: inserted.id,
              actionType: act.actionType,
              targetEntityType: act.targetEntityType || null,
              targetEntityId: act.targetEntityId || null,
              parameters: act.parameters || null,
              orderIndex: act.orderIndex ?? idx,
            }))
          )
          .returning();
      }

      return this.mapToDTO(inserted, insertedActions);
    });
  }

  /**
   * Find scenario by numeric ID or scenario code (e.g. STR-20260928-001)
   */
  async findById(idOrCode: number | string): Promise<StrategyScenarioDTO | null> {
    const isCode = typeof idOrCode === 'string' && idOrCode.startsWith('STR-');
    const condition = isCode
      ? eq(relationshipScenarios.scenarioId, idOrCode as string)
      : eq(relationshipScenarios.id, Number(idOrCode));

    const [scenario] = await db
      .select({
        scenario: relationshipScenarios,
        customerName: customers.name,
        customerCode: customers.customerCode,
        creatorName: users.name,
      })
      .from(relationshipScenarios)
      .leftJoin(customers, eq(relationshipScenarios.customerId, customers.id))
      .leftJoin(users, eq(relationshipScenarios.createdBy, users.id))
      .where(condition);

    if (!scenario) return null;

    const actions = await db
      .select()
      .from(relationshipScenarioActions)
      .where(eq(relationshipScenarioActions.scenarioId, scenario.scenario.id))
      .orderBy(relationshipScenarioActions.orderIndex);

    return this.mapToDTO(scenario.scenario, actions, {
      customerName: scenario.customerName || undefined,
      customerCode: scenario.customerCode || undefined,
      creatorName: scenario.creatorName || undefined,
    });
  }

  /**
   * Find all scenarios for a customer
   */
  async findByCustomerId(customerId: number): Promise<StrategyScenarioDTO[]> {
    const rows = await db
      .select({
        scenario: relationshipScenarios,
        customerName: customers.name,
        customerCode: customers.customerCode,
        creatorName: users.name,
      })
      .from(relationshipScenarios)
      .leftJoin(customers, eq(relationshipScenarios.customerId, customers.id))
      .leftJoin(users, eq(relationshipScenarios.createdBy, users.id))
      .where(eq(relationshipScenarios.customerId, customerId))
      .orderBy(desc(relationshipScenarios.createdAt));

    if (rows.length === 0) return [];

    const scenarioIds = rows.map((r) => r.scenario.id);
    const actions = await db
      .select()
      .from(relationshipScenarioActions)
      .where(inArray(relationshipScenarioActions.scenarioId, scenarioIds))
      .orderBy(relationshipScenarioActions.orderIndex);

    const actionMap = new Map<number, any[]>();
    for (const act of actions) {
      if (!actionMap.has(act.scenarioId)) {
        actionMap.set(act.scenarioId, []);
      }
      actionMap.get(act.scenarioId)!.push(act);
    }

    return rows.map((r) =>
      this.mapToDTO(r.scenario, actionMap.get(r.scenario.id) || [], {
        customerName: r.customerName || undefined,
        customerCode: r.customerCode || undefined,
        creatorName: r.creatorName || undefined,
      })
    );
  }

  /**
   * List scenarios across authorized customer IDs
   */
  async listScenarios(
    customerIds?: number[],
    filters?: { status?: string; limit?: number; offset?: number }
  ): Promise<StrategyScenarioDTO[]> {
    const conditions = [];
    if (customerIds && customerIds.length > 0) {
      conditions.push(inArray(relationshipScenarios.customerId, customerIds));
    }
    if (filters?.status) {
      conditions.push(eq(relationshipScenarios.status, filters.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    const rows = await db
      .select({
        scenario: relationshipScenarios,
        customerName: customers.name,
        customerCode: customers.customerCode,
        creatorName: users.name,
      })
      .from(relationshipScenarios)
      .leftJoin(customers, eq(relationshipScenarios.customerId, customers.id))
      .leftJoin(users, eq(relationshipScenarios.createdBy, users.id))
      .where(whereClause)
      .orderBy(desc(relationshipScenarios.createdAt))
      .limit(limit)
      .offset(offset);

    if (rows.length === 0) return [];

    const scenarioIds = rows.map((r) => r.scenario.id);
    const actions = await db
      .select()
      .from(relationshipScenarioActions)
      .where(inArray(relationshipScenarioActions.scenarioId, scenarioIds))
      .orderBy(relationshipScenarioActions.orderIndex);

    const actionMap = new Map<number, any[]>();
    for (const act of actions) {
      if (!actionMap.has(act.scenarioId)) {
        actionMap.set(act.scenarioId, []);
      }
      actionMap.get(act.scenarioId)!.push(act);
    }

    return rows.map((r) =>
      this.mapToDTO(r.scenario, actionMap.get(r.scenario.id) || [], {
        customerName: r.customerName || undefined,
        customerCode: r.customerCode || undefined,
        creatorName: r.creatorName || undefined,
      })
    );
  }

  /**
   * Update scenario attributes (status, results, staleness, etc.)
   */
  async updateScenario(
    id: number,
    data: {
      name?: string;
      description?: string;
      status?: 'DRAFT' | 'SIMULATED' | 'SAVED' | 'ARCHIVED';
      resultSnapshot?: any;
      comparisonDelta?: any;
      decisionTraceId?: string;
      isStale?: boolean;
      staleAsOf?: Date | null;
    }
  ): Promise<StrategyScenarioDTO | null> {
    const updateValues: Record<string, any> = {
      updatedAt: new Date(),
    };
    if (data.name !== undefined) updateValues.name = data.name;
    if (data.description !== undefined) updateValues.description = data.description;
    if (data.status !== undefined) updateValues.status = data.status;
    if (data.resultSnapshot !== undefined) updateValues.resultSnapshot = data.resultSnapshot;
    if (data.comparisonDelta !== undefined) updateValues.comparisonDelta = data.comparisonDelta;
    if (data.decisionTraceId !== undefined) updateValues.decisionTraceId = data.decisionTraceId;
    if (data.isStale !== undefined) updateValues.isStale = data.isStale;
    if (data.staleAsOf !== undefined) updateValues.staleAsOf = data.staleAsOf;

    await db
      .update(relationshipScenarios)
      .set(updateValues)
      .where(eq(relationshipScenarios.id, id));

    return this.findById(id);
  }

  /**
   * Replace scenario actions
   */
  async replaceActions(scenarioId: number, actions: ScenarioActionItem[]): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .delete(relationshipScenarioActions)
        .where(eq(relationshipScenarioActions.scenarioId, scenarioId));

      if (actions.length > 0) {
        await tx.insert(relationshipScenarioActions).values(
          actions.map((act, idx) => ({
            scenarioId,
            actionType: act.actionType,
            targetEntityType: act.targetEntityType || null,
            targetEntityId: act.targetEntityId || null,
            parameters: act.parameters || null,
            orderIndex: act.orderIndex ?? idx,
          }))
        );
      }
    });
  }

  /**
   * Search scenarios by text (code, name, description)
   */
  async searchScenarios(query: string, customerIds?: number[]): Promise<StrategyScenarioDTO[]> {
    const trimmed = `%${query.trim()}%`;
    const searchCondition = or(
      ilike(relationshipScenarios.scenarioId, trimmed),
      ilike(relationshipScenarios.name, trimmed),
      ilike(relationshipScenarios.description, trimmed)
    );

    const conditions = [searchCondition];
    if (customerIds && customerIds.length > 0) {
      conditions.push(inArray(relationshipScenarios.customerId, customerIds));
    }

    const rows = await db
      .select({
        scenario: relationshipScenarios,
        customerName: customers.name,
        customerCode: customers.customerCode,
        creatorName: users.name,
      })
      .from(relationshipScenarios)
      .leftJoin(customers, eq(relationshipScenarios.customerId, customers.id))
      .leftJoin(users, eq(relationshipScenarios.createdBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(relationshipScenarios.createdAt))
      .limit(20);

    return rows.map((r) =>
      this.mapToDTO(r.scenario, [], {
        customerName: r.customerName || undefined,
        customerCode: r.customerCode || undefined,
        creatorName: r.creatorName || undefined,
      })
    );
  }

  /**
   * Descriptive analytics across authorized scenarios
   */
  async getAnalytics(customerIds?: number[]): Promise<StrategyAnalyticsSummaryDTO> {
    const conditions = [];
    if (customerIds && customerIds.length > 0) {
      conditions.push(inArray(relationshipScenarios.customerId, customerIds));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const allScenarios = await db
      .select()
      .from(relationshipScenarios)
      .where(whereClause);

    const totalScenarios = allScenarios.length;
    const totalSimulationsRun = allScenarios.filter(
      (s) => s.status === 'SIMULATED' || s.status === 'SAVED' || s.resultSnapshot !== null
    ).length;
    const savedScenarios = allScenarios.filter((s) => s.status === 'SAVED').length;
    const archivedScenarios = allScenarios.filter((s) => s.status === 'ARCHIVED').length;

    // Actions breakdown
    const scenarioIds = allScenarios.map((s) => s.id);
    const actionFrequency: Record<string, number> = {};
    if (scenarioIds.length > 0) {
      const actions = await db
        .select()
        .from(relationshipScenarioActions)
        .where(inArray(relationshipScenarioActions.scenarioId, scenarioIds));

      for (const act of actions) {
        actionFrequency[act.actionType] = (actionFrequency[act.actionType] || 0) + 1;
      }
    }

    // User activity breakdown
    const userCounts: Record<number, number> = {};
    for (const s of allScenarios) {
      userCounts[s.createdBy] = (userCounts[s.createdBy] || 0) + 1;
    }
    const userEntries = Object.entries(userCounts);
    let userActivity: Array<{ userId: number; userName: string; count: number }> = [];
    if (userEntries.length > 0) {
      const uIds = userEntries.map(([id]) => Number(id));
      const userRows = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, uIds));
      const uMap = new Map(userRows.map((u) => [u.id, u.name]));
      userActivity = userEntries.map(([idStr, count]) => ({
        userId: Number(idStr),
        userName: uMap.get(Number(idStr)) || `User #${idStr}`,
        count,
      }));
    }

    // Timeline breakdown (by date YYYY-MM-DD)
    const timelineMap: Record<string, number> = {};
    for (const s of allScenarios) {
      const d = s.createdAt.toISOString().split('T')[0];
      timelineMap[d] = (timelineMap[d] || 0) + 1;
    }
    const timeline = Object.entries(timelineMap).map(([date, count]) => ({ date, count }));

    return {
      totalScenarios,
      totalSimulationsRun,
      savedScenarios,
      archivedScenarios,
      actionTypeFrequency: actionFrequency,
      userActivity,
      timeline,
    };
  }

  private mapToDTO(
    raw: any,
    actions: any[],
    meta?: { customerName?: string; customerCode?: string; creatorName?: string }
  ): StrategyScenarioDTO {
    return {
      id: raw.id,
      scenarioId: raw.scenarioId,
      customerId: raw.customerId,
      customerName: meta?.customerName,
      customerCode: meta?.customerCode,
      createdBy: raw.createdBy,
      creatorName: meta?.creatorName,
      name: raw.name,
      description: raw.description || undefined,
      status: raw.status,
      actions: actions.map((a) => ({
        id: a.id,
        actionType: a.actionType,
        targetEntityType: a.targetEntityType || undefined,
        targetEntityId: a.targetEntityId || undefined,
        parameters: a.parameters || undefined,
        orderIndex: a.orderIndex,
      })),
      baseSnapshot: raw.baseSnapshot,
      resultSnapshot: raw.resultSnapshot || undefined,
      comparisons: raw.comparisonDelta || undefined,
      decisionTraceId: raw.decisionTraceId || undefined,
      isStale: raw.isStale,
      staleAsOf: raw.staleAsOf ? raw.staleAsOf.toISOString() : undefined,
      createdAt: raw.createdAt.toISOString(),
      updatedAt: raw.updatedAt.toISOString(),
    };
  }
}

export const strategySimulatorRepository = new StrategySimulatorRepository();
