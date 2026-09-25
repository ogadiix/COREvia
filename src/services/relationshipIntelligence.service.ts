import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  customerInsights,
  customers,
  auditLogs,
  users,
} from '../db/schema.ts';
import { customerRepository } from '../repositories/customer.repository.ts';
import type {
  CustomerInsight,
  RelationshipIntelligenceSummary,
  InsightType,
  InsightPriority,
  InsightStatus,
  InsightCategory,
} from '../types/index.ts';
import {
  evaluateRulesForCustomer,
  RULE_VERSION,
} from './relationshipInsightRules.ts';
import type { GeneratedInsightCandidate } from './relationshipInsightRules.ts';
import { BankingError } from '../lib/errors.ts';

export interface ListInsightsFilterParams {
  customerId?: number;
  category?: string;
  priority?: string;
  status?: string;
  search?: string;
  assignedRm?: string;
  page?: number;
  limit?: number;
}

export interface SafeActor {
  id?: number;
  employeeId?: string;
  name?: string;
  email?: string;
}

export const relationshipIntelligenceService = {
  /**
   * Deterministically evaluate and synchronize insights for a specific customer
   */
  async evaluateCustomer(customerId: number, actorContext?: SafeActor): Promise<CustomerInsight[]> {
    const bundle = await customerRepository.getCustomer360(customerId);
    if (!bundle || !bundle.customer) {
      throw new BankingError(`Customer not found with ID ${customerId}`, 'CUSTOMER_NOT_FOUND', 404);
    }

    // 1. Run deterministic rules against verified CRM records
    const candidates = evaluateRulesForCustomer(bundle);

    // 2. Fetch current non-expired insights for this customer
    const existingRows = await db
      .select()
      .from(customerInsights)
      .where(eq(customerInsights.customerId, customerId));

    const existingMap = new Map<string, typeof existingRows[0]>();
    existingRows.forEach((row) => {
      existingMap.set(row.dedupKey, row);
    });

    const activeCandidateKeys = new Set<string>();
    const now = new Date();

    // 3. Upsert candidate insights
    for (const cand of candidates) {
      activeCandidateKeys.add(cand.dedupKey);
      const existing = existingMap.get(cand.dedupKey);

      if (!existing) {
        // New insight detected
        const [inserted] = await db
          .insert(customerInsights)
          .values({
            customerId: cand.customerId,
            insightId: cand.insightId,
            insightType: cand.insightType,
            category: cand.category,
            title: cand.title,
            summary: cand.summary,
            description: cand.description,
            impact: cand.impact,
            priority: cand.priority,
            urgency: cand.priority,
            confidence: cand.confidence,
            confidenceScore: String(cand.confidenceScore),
            status: 'ACTIVE',
            detectedAt: now,
            sourceEntityType: cand.sourceEntityType,
            sourceEntityId: cand.sourceEntityId,
            evidence: JSON.stringify(cand.evidence),
            recommendedActionType: cand.recommendedActionType,
            recommendedActionContext: cand.recommendedActionContext,
            ruleVersion: cand.ruleVersion,
            dedupKey: cand.dedupKey,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        // Audit Log: INSIGHT_CREATED
        await db.insert(auditLogs).values({
          actorId: actorContext?.employeeId || 'SYSTEM_RI_ENGINE',
          actorName: actorContext?.name || 'Relationship Intelligence Engine',
          action: 'INSIGHT_CREATED',
          resourceType: 'CUSTOMER_INSIGHT',
          resourceId: cand.insightId,
          requestId: `REQ-INS-NEW-${Date.now()}`,
          outcome: 'SUCCESS',
          metadata: JSON.stringify({
            customerId,
            category: cand.category,
            priority: cand.priority,
            ruleVersion: cand.ruleVersion,
          }),
        });
      } else {
        // Existing insight: If was active, refresh evidence, summary & priority if changed
        if (existing.status === 'ACTIVE' || existing.status === 'ACKNOWLEDGED') {
          const evidenceJson = JSON.stringify(cand.evidence);
          const hasChanged =
            existing.priority !== cand.priority ||
            existing.summary !== cand.summary ||
            existing.evidence !== evidenceJson;

          if (hasChanged) {
            await db
              .update(customerInsights)
              .set({
                title: cand.title,
                summary: cand.summary,
                description: cand.description,
                impact: cand.impact,
                priority: cand.priority,
                urgency: cand.priority,
                evidence: evidenceJson,
                confidenceScore: String(cand.confidenceScore),
                recommendedActionType: cand.recommendedActionType,
                recommendedActionContext: cand.recommendedActionContext,
                updatedAt: now,
              })
              .where(eq(customerInsights.id, existing.id));

            // Audit Log: INSIGHT_UPDATED
            await db.insert(auditLogs).values({
              actorId: actorContext?.employeeId || 'SYSTEM_RI_ENGINE',
              actorName: actorContext?.name || 'Relationship Intelligence Engine',
              action: 'INSIGHT_UPDATED',
              resourceType: 'CUSTOMER_INSIGHT',
              resourceId: existing.insightId,
              requestId: `REQ-INS-UPD-${Date.now()}`,
              outcome: 'SUCCESS',
              metadata: JSON.stringify({
                customerId,
                priorityChange: `${existing.priority} -> ${cand.priority}`,
                category: cand.category,
              }),
            });
          }
        }
      }
    }

    // 4. Automatic Resolution: Check previously ACTIVE insights that are no longer triggered
    for (const existing of existingRows) {
      if ((existing.status === 'ACTIVE' || existing.status === 'ACKNOWLEDGED') && !activeCandidateKeys.has(existing.dedupKey)) {
        await db
          .update(customerInsights)
          .set({
            status: 'RESOLVED',
            resolvedAt: now,
            resolutionType: 'AUTOMATIC',
            resolutionNote: 'Condition automatically resolved: Underlying CRM records or metrics have cleared the alert threshold.',
            updatedAt: now,
          })
          .where(eq(customerInsights.id, existing.id));

        // Audit Log: INSIGHT_RESOLVED (AUTOMATIC)
        await db.insert(auditLogs).values({
          actorId: actorContext?.employeeId || 'SYSTEM_RI_ENGINE',
          actorName: actorContext?.name || 'Relationship Intelligence Engine',
          action: 'INSIGHT_RESOLVED',
          resourceType: 'CUSTOMER_INSIGHT',
          resourceId: existing.insightId,
          requestId: `REQ-INS-AUTORES-${Date.now()}`,
          outcome: 'SUCCESS',
          metadata: JSON.stringify({
            customerId,
            resolutionType: 'AUTOMATIC',
            reason: 'Underlying CRM criteria no longer breached',
          }),
        });
      }
    }

    // 5. Return updated list of active insights for this customer
    return this.getCustomerInsights(customerId);
  },

  /**
   * Fetch structured insights for a specific customer
   */
  async getCustomerInsights(customerId: number): Promise<CustomerInsight[]> {
    const rows = await db
      .select({
        insight: customerInsights,
        customer: customers,
      })
      .from(customerInsights)
      .innerJoin(customers, eq(customerInsights.customerId, customers.id))
      .where(eq(customerInsights.customerId, customerId))
      .orderBy(
        sql`CASE 
          WHEN ${customerInsights.priority} = 'CRITICAL' THEN 1 
          WHEN ${customerInsights.priority} = 'HIGH' THEN 2 
          WHEN ${customerInsights.priority} = 'MEDIUM' THEN 3 
          ELSE 4 
        END`,
        desc(customerInsights.detectedAt)
      );

    return rows.map((r) => this.mapToCustomerInsight(r.insight, r.customer));
  },

  /**
   * Query insights queue with filtering, search, and pagination
   */
  async listInsights(params: ListInsightsFilterParams = {}): Promise<{
    data: CustomerInsight[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (params.customerId) {
      conditions.push(eq(customerInsights.customerId, Number(params.customerId)));
    }

    if (params.category && params.category !== 'ALL') {
      conditions.push(eq(customerInsights.category, params.category));
    }

    if (params.priority && params.priority !== 'ALL') {
      conditions.push(eq(customerInsights.priority, params.priority.toUpperCase()));
    }

    if (params.status && params.status !== 'ALL') {
      conditions.push(eq(customerInsights.status, params.status.toUpperCase()));
    }

    if (params.search && params.search.trim()) {
      const term = `%${params.search.trim()}%`;
      conditions.push(
        or(
          ilike(customerInsights.title, term),
          ilike(customerInsights.summary, term),
          ilike(customerInsights.insightId, term),
          ilike(customers.name, term),
          ilike(customers.customerCode, term),
          ilike(customers.cifNumber, term)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countResult] = await Promise.all([
      db
        .select({
          insight: customerInsights,
          customer: customers,
        })
        .from(customerInsights)
        .innerJoin(customers, eq(customerInsights.customerId, customers.id))
        .where(whereClause)
        .orderBy(
          sql`CASE 
            WHEN ${customerInsights.priority} = 'CRITICAL' THEN 1 
            WHEN ${customerInsights.priority} = 'HIGH' THEN 2 
            WHEN ${customerInsights.priority} = 'MEDIUM' THEN 3 
            ELSE 4 
          END`,
          desc(customerInsights.detectedAt)
        )
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(customerInsights)
        .innerJoin(customers, eq(customerInsights.customerId, customers.id))
        .where(whereClause),
    ]);

    const total = Number(countResult[0]?.count || 0);

    return {
      data: rows.map((r) => this.mapToCustomerInsight(r.insight, r.customer)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * Get executive relationship intelligence summary metrics
   */
  async getSummary(): Promise<RelationshipIntelligenceSummary> {
    const rows = await db.select().from(customerInsights);

    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let totalActive = 0;
    let acknowledgedCount = 0;
    let resolvedCount = 0;
    let staleCount = 0;

    const byType = {
      relationshipRisk: 0,
      growthOpportunity: 0,
      serviceConcern: 0,
      engagementSignal: 0,
      operationalSignal: 0,
    };

    const now = new Date();

    rows.forEach((r) => {
      if (r.status === 'ACTIVE' || r.status === 'ACKNOWLEDGED') {
        totalActive++;
        if (r.priority === 'CRITICAL') criticalCount++;
        else if (r.priority === 'HIGH') highCount++;
        else if (r.priority === 'MEDIUM') mediumCount++;
        else lowCount++;

        if (r.insightType === 'RELATIONSHIP_RISK') byType.relationshipRisk++;
        else if (r.insightType === 'GROWTH_OPPORTUNITY') byType.growthOpportunity++;
        else if (r.insightType === 'SERVICE_CONCERN') byType.serviceConcern++;
        else if (r.insightType === 'ENGAGEMENT_SIGNAL') byType.engagementSignal++;
        else if (r.insightType === 'OPERATIONAL_SIGNAL') byType.operationalSignal++;

        // Stale check: Active > 30 days without acknowledge
        const detected = new Date(r.detectedAt);
        if ((now.getTime() - detected.getTime()) / (1000 * 3600 * 24) > 30) {
          staleCount++;
        }
      }

      if (r.status === 'ACKNOWLEDGED') acknowledgedCount++;
      if (r.status === 'RESOLVED') resolvedCount++;
    });

    return {
      totalActive,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      byType,
      acknowledgedCount,
      resolvedCount,
      staleCount,
    };
  },

  /**
   * Fetch single insight by ID with full customer details
   */
  async getInsightById(id: number): Promise<CustomerInsight> {
    const [row] = await db
      .select({
        insight: customerInsights,
        customer: customers,
      })
      .from(customerInsights)
      .innerJoin(customers, eq(customerInsights.customerId, customers.id))
      .where(eq(customerInsights.id, id))
      .limit(1);

    if (!row) {
      throw new BankingError(`Insight not found with ID ${id}`, 'INSIGHT_NOT_FOUND', 404);
    }

    return this.mapToCustomerInsight(row.insight, row.customer);
  },

  /**
   * Officer Acknowledge Insight Workflow
   */
  async acknowledgeInsight(
    id: number,
    actor: SafeActor,
    note?: string
  ): Promise<CustomerInsight> {
    const [existing] = await db
      .select()
      .from(customerInsights)
      .where(eq(customerInsights.id, id))
      .limit(1);

    if (!existing) {
      throw new BankingError(`Insight not found with ID ${id}`, 'INSIGHT_NOT_FOUND', 404);
    }

    if (existing.status === 'RESOLVED') {
      throw new BankingError('Cannot acknowledge an already resolved insight.', 'INVALID_STATE', 400);
    }

    const now = new Date();
    await db
      .update(customerInsights)
      .set({
        status: 'ACKNOWLEDGED',
        acknowledgedById: actor.id || null,
        acknowledgedByName: actor.name || 'Bank Officer',
        acknowledgedAt: now,
        acknowledgementNote: note ? note.trim() : 'Acknowledged by Relationship Manager for follow-up.',
        updatedAt: now,
      })
      .where(eq(customerInsights.id, id));

    // Audit Log: INSIGHT_ACKNOWLEDGED
    await db.insert(auditLogs).values({
      actorId: actor.employeeId || 'SYSTEM',
      actorName: actor.name || 'Bank Officer',
      action: 'INSIGHT_ACKNOWLEDGED',
      resourceType: 'CUSTOMER_INSIGHT',
      resourceId: existing.insightId,
      requestId: `REQ-ACK-${Date.now()}`,
      outcome: 'SUCCESS',
      metadata: JSON.stringify({
        insightId: existing.insightId,
        customerId: existing.customerId,
        note: note || '',
      }),
    });

    return this.getInsightById(id);
  },

  /**
   * Officer Resolve Insight Workflow
   */
  async resolveInsight(
    id: number,
    actor: SafeActor,
    note?: string
  ): Promise<CustomerInsight> {
    const [existing] = await db
      .select()
      .from(customerInsights)
      .where(eq(customerInsights.id, id))
      .limit(1);

    if (!existing) {
      throw new BankingError(`Insight not found with ID ${id}`, 'INSIGHT_NOT_FOUND', 404);
    }

    const now = new Date();
    await db
      .update(customerInsights)
      .set({
        status: 'RESOLVED',
        resolvedAt: now,
        resolutionType: 'MANUAL',
        resolutionNote: note ? note.trim() : 'Action completed and signal resolved by Officer.',
        updatedAt: now,
      })
      .where(eq(customerInsights.id, id));

    // Audit Log: INSIGHT_RESOLVED
    await db.insert(auditLogs).values({
      actorId: actor.employeeId || 'SYSTEM',
      actorName: actor.name || 'Bank Officer',
      action: 'INSIGHT_RESOLVED',
      resourceType: 'CUSTOMER_INSIGHT',
      resourceId: existing.insightId,
      requestId: `REQ-RES-${Date.now()}`,
      outcome: 'SUCCESS',
      metadata: JSON.stringify({
        insightId: existing.insightId,
        customerId: existing.customerId,
        resolutionType: 'MANUAL',
        note: note || '',
      }),
    });

    return this.getInsightById(id);
  },

  /**
   * Recalculate intelligence across all existing customers
   */
  async recalculateAll(actorContext?: SafeActor): Promise<{ evaluatedCustomers: number; totalSignals: number }> {
    const allCustomers = await db.select({ id: customers.id }).from(customers);
    let totalSignals = 0;

    for (const cust of allCustomers) {
      try {
        const insights = await this.evaluateCustomer(cust.id, actorContext);
        totalSignals += insights.filter((i) => i.status === 'ACTIVE' || i.status === 'ACKNOWLEDGED').length;
      } catch (err) {
        console.warn(`Failed intelligence evaluation for customer ${cust.id}:`, err);
      }
    }

    return {
      evaluatedCustomers: allCustomers.length,
      totalSignals,
    };
  },

  /**
   * Helper to map DB row and Customer to CustomerInsight model
   */
  mapToCustomerInsight(row: any, customer?: any): CustomerInsight {
    let parsedEvidence = [];
    try {
      parsedEvidence = row.evidence ? JSON.parse(row.evidence) : [];
    } catch {
      parsedEvidence = [];
    }

    return {
      id: row.id,
      customerId: row.customerId,
      customerName: customer?.name || 'Bank Customer',
      customerCode: customer?.customerCode || `CUST-${row.customerId}`,
      cifNumber: customer?.cifNumber || '',
      assignedRmName: customer?.assignedRmName || 'Branch RM',
      customerSegment: customer?.segment || 'RETAIL',
      customerRiskCategory: customer?.riskCategory || 'LOW',
      insightId: row.insightId || `INS-${row.id}`,
      insightType: row.insightType as InsightType,
      category: row.category as InsightCategory,
      title: row.title,
      summary: row.summary || row.description,
      description: row.description,
      impact: row.impact || 'Relationship and risk monitoring impact.',
      priority: (row.priority || row.urgency || 'MEDIUM') as InsightPriority,
      confidence: (row.confidence || 'HIGH') as any,
      confidenceScore: Number(row.confidenceScore) || 0.9,
      status: (row.status || 'ACTIVE') as InsightStatus,
      detectedAt: row.detectedAt ? new Date(row.detectedAt).toISOString() : new Date().toISOString(),
      validUntil: row.validUntil ? new Date(row.validUntil).toISOString() : null,
      sourceEntityType: row.sourceEntityType || 'CUSTOMER',
      sourceEntityId: row.sourceEntityId || '0',
      evidence: parsedEvidence,
      recommendedActionType: row.recommendedActionType,
      recommendedActionContext: row.recommendedActionContext,
      ruleVersion: row.ruleVersion || RULE_VERSION,
      dedupKey: row.dedupKey || '',
      isDismissed: row.isDismissed || false,
      actionPrompt: row.actionPrompt,
      acknowledgedById: row.acknowledgedById,
      acknowledgedByName: row.acknowledgedByName,
      acknowledgedAt: row.acknowledgedAt ? new Date(row.acknowledgedAt).toISOString() : null,
      acknowledgementNote: row.acknowledgementNote,
      resolvedAt: row.resolvedAt ? new Date(row.resolvedAt).toISOString() : null,
      resolutionType: row.resolutionType,
      resolutionNote: row.resolutionNote,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
    };
  },
};
