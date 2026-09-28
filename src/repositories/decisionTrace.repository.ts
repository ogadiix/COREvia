import { db } from '../db/index.ts';
import {
  decisionTraces,
  decisionTraceEvidence,
  decisionTraceSourceNodes,
  customers,
  users,
} from '../db/schema.ts';
import { eq, desc, and, or, inArray, sql, count, like, ilike } from 'drizzle-orm';
import {
  DecisionTraceDTO,
  DecisionTraceEvidenceDTO,
  DecisionTraceSourceNodeDTO,
  DecisionAnalyticsSummaryDTO,
} from '../types/decisionTrace.types.ts';

export const decisionTraceRepository = {
  /**
   * Insert a new decision trace with its evidence and source nodes inside a single transaction
   */
  async createTrace(
    trace: typeof decisionTraces.$inferInsert,
    evidenceList: Omit<typeof decisionTraceEvidence.$inferInsert, 'decisionTraceId'>[],
    sourceNodesList: Omit<typeof decisionTraceSourceNodes.$inferInsert, 'decisionTraceId'>[]
  ) {
    return await db.transaction(async (tx) => {
      const [insertedTrace] = await tx.insert(decisionTraces).values(trace).returning();

      if (evidenceList.length > 0) {
        const evidenceToInsert = evidenceList.map((e) => ({
          ...e,
          decisionTraceId: insertedTrace.id,
        }));
        await tx.insert(decisionTraceEvidence).values(evidenceToInsert);
      }

      if (sourceNodesList.length > 0) {
        const sourceNodesToInsert = sourceNodesList.map((s, idx) => ({
          ...s,
          decisionTraceId: insertedTrace.id,
          orderIndex: s.orderIndex ?? idx,
        }));
        await tx.insert(decisionTraceSourceNodes).values(sourceNodesToInsert);
      }

      return insertedTrace;
    });
  },

  /**
   * Find a trace by its numeric database ID or string decision code (e.g. DT-20260928-00142)
   */
  async findByCodeOrId(codeOrId: string | number) {
    const isNum = typeof codeOrId === 'number' || /^\d+$/.test(String(codeOrId));
    const condition = isNum
      ? eq(decisionTraces.id, Number(codeOrId))
      : eq(decisionTraces.decisionId, String(codeOrId));

    const rows = await db
      .select({
        trace: decisionTraces,
        customerName: customers.name,
        customerCif: customers.cifNumber,
        confirmedByName: users.name,
      })
      .from(decisionTraces)
      .leftJoin(customers, eq(decisionTraces.customerId, customers.id))
      .leftJoin(users, eq(decisionTraces.confirmedById, users.id))
      .where(condition)
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0];
    const trace = row.trace;

    const evidenceRows = await db
      .select()
      .from(decisionTraceEvidence)
      .where(eq(decisionTraceEvidence.decisionTraceId, trace.id))
      .orderBy(desc(decisionTraceEvidence.createdAt));

    const sourceRows = await db
      .select()
      .from(decisionTraceSourceNodes)
      .where(eq(decisionTraceSourceNodes.decisionTraceId, trace.id))
      .orderBy(decisionTraceSourceNodes.orderIndex);

    return {
      trace,
      customerName: row.customerName,
      customerCif: row.customerCif,
      confirmedByName: row.confirmedByName,
      evidence: evidenceRows,
      sourceNodes: sourceRows,
    };
  },

  /**
   * List traces for a given customer or a list of authorized customers
   */
  async findByCustomers(
    customerIds: number[] | null,
    options: {
      sourceEngine?: string;
      decisionType?: string;
      decisionStatus?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const conditions = [];

    if (customerIds && customerIds.length > 0) {
      conditions.push(inArray(decisionTraces.customerId, customerIds));
    } else if (customerIds && customerIds.length === 0) {
      return { items: [], total: 0 };
    }

    if (options.sourceEngine) {
      conditions.push(eq(decisionTraces.sourceEngine, options.sourceEngine));
    }
    if (options.decisionType) {
      conditions.push(eq(decisionTraces.decisionType, options.decisionType));
    }
    if (options.decisionStatus) {
      conditions.push(eq(decisionTraces.decisionStatus, options.decisionStatus));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    const [countResult] = await db
      .select({ count: count() })
      .from(decisionTraces)
      .where(whereClause);

    const rows = await db
      .select({
        trace: decisionTraces,
        customerName: customers.name,
        customerCif: customers.cifNumber,
        confirmedByName: users.name,
      })
      .from(decisionTraces)
      .leftJoin(customers, eq(decisionTraces.customerId, customers.id))
      .leftJoin(users, eq(decisionTraces.confirmedById, users.id))
      .where(whereClause)
      .orderBy(desc(decisionTraces.generatedAt))
      .limit(limit)
      .offset(offset);

    return {
      items: rows,
      total: Number(countResult?.count || 0),
    };
  },

  /**
   * Update decision trace status (e.g. CONFIRMED, REJECTED, EXECUTED)
   */
  async updateStatus(
    traceId: number,
    status: string,
    updates: {
      confirmedById?: number;
      confirmedAt?: Date;
      executionStatus?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
      executedAt?: Date;
      outcome?: string;
    } = {}
  ) {
    const [updated] = await db
      .update(decisionTraces)
      .set({
        decisionStatus: status,
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(decisionTraces.id, traceId))
      .returning();

    return updated;
  },

  /**
   * Search traces by ID or recommendation title across authorized customer IDs
   */
  async searchTraces(query: string, customerIds: number[] | null, limit = 10) {
    const cleanQ = query.trim();
    if (!cleanQ) return [];

    const conditions = [
      or(
        ilike(decisionTraces.decisionId, `%${cleanQ}%`),
        ilike(decisionTraces.recommendationTitle, `%${cleanQ}%`),
        ilike(decisionTraces.recommendationSummary, `%${cleanQ}%`)
      ),
    ];

    if (customerIds && customerIds.length > 0) {
      conditions.push(inArray(decisionTraces.customerId, customerIds));
    } else if (customerIds && customerIds.length === 0) {
      return [];
    }

    return await db
      .select({
        trace: decisionTraces,
        customerName: customers.name,
        customerCif: customers.cifNumber,
      })
      .from(decisionTraces)
      .leftJoin(customers, eq(decisionTraces.customerId, customers.id))
      .where(and(...conditions))
      .orderBy(desc(decisionTraces.generatedAt))
      .limit(limit);
  },

  /**
   * Aggregated descriptive analytics (no fabricated predictive statistics)
   */
  async getAnalytics(customerIds: number[] | null): Promise<DecisionAnalyticsSummaryDTO> {
    const conditions = [];
    if (customerIds && customerIds.length > 0) {
      conditions.push(inArray(decisionTraces.customerId, customerIds));
    } else if (customerIds && customerIds.length === 0) {
      return {
        totalTracesGenerated: 0,
        totalTracesViewed: 0,
        statusBreakdown: { pending: 0, confirmed: 0, rejected: 0, executed: 0, cancelled: 0, expired: 0 },
        modeBreakdown: { deterministic: 0, hybrid: 0, aiGenerated: 0, systemRule: 0 },
        tracesBySourceEngine: [],
        tracesByDecisionType: [],
        recentActivity: [],
      };
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const allTraces = await db
      .select({
        id: decisionTraces.id,
        status: decisionTraces.decisionStatus,
        mode: decisionTraces.decisionMode,
        engine: decisionTraces.sourceEngine,
        type: decisionTraces.decisionType,
        generatedAt: decisionTraces.generatedAt,
      })
      .from(decisionTraces)
      .where(whereClause);

    const statusBreakdown = {
      pending: 0,
      confirmed: 0,
      rejected: 0,
      executed: 0,
      cancelled: 0,
      expired: 0,
    };

    const modeBreakdown = {
      deterministic: 0,
      hybrid: 0,
      aiGenerated: 0,
      systemRule: 0,
    };

    const engineMap: Record<string, number> = {};
    const typeMap: Record<string, number> = {};

    for (const t of allTraces) {
      // Status
      const st = t.status.toLowerCase() as keyof typeof statusBreakdown;
      if (statusBreakdown[st] !== undefined) statusBreakdown[st]++;

      // Mode
      if (t.mode === 'DETERMINISTIC') modeBreakdown.deterministic++;
      else if (t.mode === 'HYBRID') modeBreakdown.hybrid++;
      else if (t.mode === 'AI_GENERATED') modeBreakdown.aiGenerated++;
      else if (t.mode === 'SYSTEM_RULE') modeBreakdown.systemRule++;

      // Engine
      engineMap[t.engine] = (engineMap[t.engine] || 0) + 1;
      // Type
      typeMap[t.type] = (typeMap[t.type] || 0) + 1;
    }

    return {
      totalTracesGenerated: allTraces.length,
      totalTracesViewed: allTraces.length,
      statusBreakdown,
      modeBreakdown,
      tracesBySourceEngine: Object.entries(engineMap).map(([engine, count]) => ({ engine, count })),
      tracesByDecisionType: Object.entries(typeMap).map(([type, count]) => ({ type, count })),
      recentActivity: [
        {
          date: new Date().toISOString().split('T')[0],
          generated: allTraces.length,
          confirmed: statusBreakdown.confirmed + statusBreakdown.executed,
          executed: statusBreakdown.executed,
        },
      ],
    };
  },
};
