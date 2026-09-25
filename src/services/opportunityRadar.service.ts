import { eq, and, desc, sql, ilike, or, inArray } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  customerOpportunityRadar,
  customerOpportunityRadarEvidence,
  customers,
  auditLogs,
  users,
  opportunities,
  products,
} from '../db/schema.ts';
import { customerRepository } from '../repositories/customer.repository.ts';
import { opportunityRepository } from '../repositories/opportunity.repository.ts';
import type {
  OpportunityRadarSignal,
  RadarEvidence,
  RadarSummaryStats,
} from '../types/index.ts';
import { evaluateCustomerOpportunityRadar } from './opportunityRadarRules.ts';
import { BankingError } from '../lib/errors.ts';

export interface ListRadarParams {
  customerId?: number;
  assignedRmId?: number;
  category?: string;
  priority?: string;
  status?: string;
  signalType?: string;
  search?: string;
  sortBy?: 'relevance' | 'priority' | 'date' | 'customer';
  sortOrder?: 'asc' | 'desc';
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

export const opportunityRadarService = {
  /**
   * Deterministically evaluate Opportunity Radar signals for a specific customer
   */
  async evaluateCustomer(customerId: number, actorContext?: SafeActor): Promise<OpportunityRadarSignal[]> {
    const bundle = await customerRepository.getCustomer360(customerId);
    if (!bundle || !bundle.customer) {
      throw new BankingError(`Customer not found with ID ${customerId}`, 'CUSTOMER_NOT_FOUND', 404);
    }

    // Fetch product catalog for accurate product linking
    const catalog = await db.select().from(products).where(eq(products.isActive, true));

    // 1. Run deterministic rules against verified CRM records
    const candidates = evaluateCustomerOpportunityRadar({
      ...bundle,
      catalogProducts: catalog,
    });

    // 2. Fetch existing radar signals for this customer
    const existingRows = await db
      .select()
      .from(customerOpportunityRadar)
      .where(eq(customerOpportunityRadar.customerId, customerId));

    const existingMap = new Map<string, typeof existingRows[0]>();
    existingRows.forEach((row) => {
      existingMap.set(row.dedupKey, row);
    });

    const activeCandidateKeys = new Set<string>();
    const now = new Date();

    // 3. Upsert candidate signals
    for (const cand of candidates) {
      activeCandidateKeys.add(cand.dedupKey);
      const existing = existingMap.get(cand.dedupKey);

      if (!existing) {
        // Insert new signal
        const [newRecord] = await db
          .insert(customerOpportunityRadar)
          .values({
            radarId: cand.radarId,
            customerId: cand.customerId,
            signalType: cand.signalType,
            title: cand.title,
            summary: cand.summary,
            category: cand.category,
            priority: cand.priority,
            relevanceScore: cand.relevanceScore,
            confidence: cand.confidence,
            rationale: cand.rationale,
            expectedValueBand: cand.expectedValueBand,
            status: 'REVIEW_SUGGESTED',
            ruleId: cand.ruleId,
            ruleVersion: cand.ruleVersion,
            targetProductId: cand.targetProductId || null,
            existingOpportunityId: cand.existingOpportunityId || null,
            expiresAt: cand.expiresAt || null,
            evidence: JSON.stringify(cand.evidence),
            dedupKey: cand.dedupKey,
          })
          .returning();

        // Insert normalized evidence records
        if (cand.evidence && cand.evidence.length > 0) {
          const evidenceRows = cand.evidence.map((ev) => ({
            radarId: newRecord.id,
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

          await db.insert(customerOpportunityRadarEvidence).values(evidenceRows);
        }
      } else if (existing.status === 'DETECTED' || existing.status === 'REVIEW_SUGGESTED') {
        // Update relevance and priority
        await db
          .update(customerOpportunityRadar)
          .set({
            relevanceScore: cand.relevanceScore,
            priority: cand.priority,
            summary: cand.summary,
            rationale: cand.rationale,
            evidence: JSON.stringify(cand.evidence),
            updatedAt: now,
          })
          .where(eq(customerOpportunityRadar.id, existing.id));
      }
    }

    // 4. Lifecycle transition: Mark active signals that are no longer triggered as EXPIRED
    for (const existing of existingRows) {
      if (
        (existing.status === 'DETECTED' || existing.status === 'REVIEW_SUGGESTED') &&
        !activeCandidateKeys.has(existing.dedupKey)
      ) {
        await db
          .update(customerOpportunityRadar)
          .set({
            status: 'EXPIRED',
            updatedAt: now,
          })
          .where(eq(customerOpportunityRadar.id, existing.id));
      }
    }

    // 5. Audit log generation
    if (actorContext?.name) {
      await db.insert(auditLogs).values({
        actorId: actorContext.employeeId || String(actorContext.id || 'SYSTEM'),
        actorName: actorContext.name,
        action: 'RADAR_EVALUATED',
        resourceType: 'CUSTOMER_RADAR',
        resourceId: String(customerId),
        requestId: actorContext.requestId || `REQ-RADAR-EVAL-${Date.now()}`,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({
          customerId,
          generatedCount: candidates.length,
          topSignal: candidates[0]?.title || 'None',
        }),
      });
    }

    return await this.listSignals({ customerId, status: 'ALL' }).then((r) => r.signals);
  },

  /**
   * Batch recalculate Opportunity Radar for all customers
   */
  async recalculateAll(actorContext?: SafeActor): Promise<{ processed: number; generated: number }> {
    const allCustomers = await db.select({ id: customers.id }).from(customers);
    let totalGenerated = 0;

    for (const cust of allCustomers) {
      try {
        const signals = await this.evaluateCustomer(cust.id, actorContext);
        totalGenerated += signals.filter(
          (s) => s.status === 'DETECTED' || s.status === 'REVIEW_SUGGESTED'
        ).length;
      } catch (err) {
        console.warn(`Failed to recalculate Opportunity Radar for customer ${cust.id}:`, err);
      }
    }

    return {
      processed: allCustomers.length,
      generated: totalGenerated,
    };
  },

  /**
   * List Opportunity Radar signals with search, filters, sorting and pagination
   */
  async listSignals(params: ListRadarParams = {}): Promise<{
    signals: OpportunityRadarSignal[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    const conditions = [];

    if (params.customerId) {
      conditions.push(eq(customerOpportunityRadar.customerId, params.customerId));
    }

    if (params.assignedRmId) {
      conditions.push(eq(customers.assignedRmId, params.assignedRmId));
    }

    if (params.category && params.category !== 'ALL') {
      conditions.push(eq(customerOpportunityRadar.category, params.category.toUpperCase()));
    }

    if (params.priority && params.priority !== 'ALL') {
      conditions.push(eq(customerOpportunityRadar.priority, params.priority.toUpperCase()));
    }

    if (params.signalType && params.signalType !== 'ALL') {
      conditions.push(eq(customerOpportunityRadar.signalType, params.signalType.toUpperCase()));
    }

    if (params.status && params.status !== 'ALL') {
      conditions.push(eq(customerOpportunityRadar.status, params.status.toUpperCase()));
    } else if (!params.status) {
      // Default: Active reviewable signals
      conditions.push(
        inArray(customerOpportunityRadar.status, ['DETECTED', 'REVIEW_SUGGESTED'])
      );
    }

    if (params.search && params.search.trim()) {
      const q = `%${params.search.trim()}%`;
      conditions.push(
        or(
          ilike(customerOpportunityRadar.title, q),
          ilike(customerOpportunityRadar.summary, q),
          ilike(customerOpportunityRadar.rationale, q),
          ilike(customerOpportunityRadar.radarId, q),
          ilike(customers.name, q),
          ilike(customers.customerCode, q),
          ilike(customers.cifNumber, q)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count total matching
    const [countRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customerOpportunityRadar)
      .leftJoin(customers, eq(customerOpportunityRadar.customerId, customers.id))
      .where(whereClause);

    const total = Number(countRes?.count || 0);

    // Dynamic sorting
    let orderByClause;
    const isAsc = params.sortOrder === 'asc';
    switch (params.sortBy) {
      case 'priority':
        orderByClause = isAsc
          ? sql`CASE ${customerOpportunityRadar.priority} WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END ASC`
          : sql`CASE ${customerOpportunityRadar.priority} WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END DESC`;
        break;
      case 'date':
        orderByClause = isAsc ? customerOpportunityRadar.detectedAt : desc(customerOpportunityRadar.detectedAt);
        break;
      case 'customer':
        orderByClause = isAsc ? customers.name : desc(customers.name);
        break;
      case 'relevance':
      default:
        orderByClause = isAsc
          ? customerOpportunityRadar.relevanceScore
          : desc(customerOpportunityRadar.relevanceScore);
        break;
    }

    // Query rows with customer & product joins
    const rows = await db
      .select({
        radar: customerOpportunityRadar,
        customerName: customers.name,
        customerCode: customers.customerCode,
        cifNumber: customers.cifNumber,
        assignedRmId: customers.assignedRmId,
        targetProductCode: products.productCode,
        targetProductName: products.name,
        convertedOppCode: opportunities.opportunityCode,
        convertedOppTitle: opportunities.title,
      })
      .from(customerOpportunityRadar)
      .leftJoin(customers, eq(customerOpportunityRadar.customerId, customers.id))
      .leftJoin(products, eq(customerOpportunityRadar.targetProductId, products.id))
      .leftJoin(opportunities, eq(customerOpportunityRadar.convertedOpportunityId, opportunities.id))
      .where(whereClause)
      .orderBy(orderByClause, desc(customerOpportunityRadar.id))
      .limit(limit)
      .offset(offset);

    const signals: OpportunityRadarSignal[] = rows.map((r) => {
      let parsedEvidence: RadarEvidence[] = [];
      try {
        parsedEvidence = JSON.parse(r.radar.evidence || '[]');
      } catch (e) {
        parsedEvidence = [];
      }

      return {
        id: r.radar.id,
        radarId: r.radar.radarId,
        customerId: r.radar.customerId,
        customerName: r.customerName || undefined,
        customerCode: r.customerCode || undefined,
        cifNumber: r.cifNumber || undefined,
        assignedRmId: r.assignedRmId || null,
        signalType: r.radar.signalType as any,
        title: r.radar.title,
        summary: r.radar.summary,
        category: r.radar.category,
        priority: r.radar.priority as any,
        relevanceScore: r.radar.relevanceScore,
        confidence: r.radar.confidence as any,
        rationale: r.radar.rationale,
        expectedValueBand: r.radar.expectedValueBand,
        status: r.radar.status as any,
        ruleId: r.radar.ruleId,
        ruleVersion: r.radar.ruleVersion,
        detectedAt: r.radar.detectedAt.toISOString(),
        expiresAt: r.radar.expiresAt?.toISOString() || null,
        convertedOpportunityId: r.radar.convertedOpportunityId,
        convertedOpportunityCode: r.convertedOppCode || null,
        convertedOpportunityTitle: r.convertedOppTitle || null,
        existingOpportunityId: r.radar.existingOpportunityId,
        targetProductId: r.radar.targetProductId,
        targetProductCode: r.targetProductCode || null,
        targetProductName: r.targetProductName || null,
        dismissedReason: r.radar.dismissedReason,
        dismissedById: r.radar.dismissedById,
        dismissedByName: r.radar.dismissedByName,
        dismissedAt: r.radar.dismissedAt?.toISOString() || null,
        reviewedById: r.radar.reviewedById,
        reviewedByName: r.radar.reviewedByName,
        reviewedAt: r.radar.reviewedAt?.toISOString() || null,
        evidence: parsedEvidence,
        evidenceCount: parsedEvidence.length,
        dedupKey: r.radar.dedupKey,
        createdAt: r.radar.createdAt.toISOString(),
        updatedAt: r.radar.updatedAt.toISOString(),
      };
    });

    return {
      signals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  /**
   * Get single radar signal with complete normalized evidence details
   */
  async getSignalById(id: number): Promise<OpportunityRadarSignal> {
    const [record] = await db
      .select({
        radar: customerOpportunityRadar,
        customerName: customers.name,
        customerCode: customers.customerCode,
        cifNumber: customers.cifNumber,
        assignedRmId: customers.assignedRmId,
        targetProductCode: products.productCode,
        targetProductName: products.name,
        convertedOppCode: opportunities.opportunityCode,
        convertedOppTitle: opportunities.title,
      })
      .from(customerOpportunityRadar)
      .leftJoin(customers, eq(customerOpportunityRadar.customerId, customers.id))
      .leftJoin(products, eq(customerOpportunityRadar.targetProductId, products.id))
      .leftJoin(opportunities, eq(customerOpportunityRadar.convertedOpportunityId, opportunities.id))
      .where(eq(customerOpportunityRadar.id, id));

    if (!record) {
      throw new BankingError(`Radar signal #${id} not found`, 'RADAR_NOT_FOUND', 404);
    }

    // Fetch normalized evidence
    const normalizedEvidence = await db
      .select()
      .from(customerOpportunityRadarEvidence)
      .where(eq(customerOpportunityRadarEvidence.radarId, id))
      .orderBy(customerOpportunityRadarEvidence.id);

    let parsedEvidence: RadarEvidence[] = [];
    if (normalizedEvidence.length > 0) {
      parsedEvidence = normalizedEvidence.map((ev) => ({
        id: ev.id,
        sourceEntityType: ev.sourceEntityType,
        sourceEntityId: ev.sourceEntityId,
        sourceEntityCode: ev.sourceEntityCode,
        recordTitle: ev.recordTitle,
        evidenceType: ev.evidenceType,
        evidenceSummary: ev.evidenceSummary,
        detail: ev.detail || undefined,
        routePath: ev.routePath || undefined,
        metricValue: ev.metricValue || undefined,
        timestamp: ev.timestamp?.toISOString() || undefined,
      }));
    } else {
      try {
        parsedEvidence = JSON.parse(record.radar.evidence || '[]');
      } catch (e) {
        parsedEvidence = [];
      }
    }

    return {
      id: record.radar.id,
      radarId: record.radar.radarId,
      customerId: record.radar.customerId,
      customerName: record.customerName || undefined,
      customerCode: record.customerCode || undefined,
      cifNumber: record.cifNumber || undefined,
      assignedRmId: record.assignedRmId || null,
      signalType: record.radar.signalType as any,
      title: record.radar.title,
      summary: record.radar.summary,
      category: record.radar.category,
      priority: record.radar.priority as any,
      relevanceScore: record.radar.relevanceScore,
      confidence: record.radar.confidence as any,
      rationale: record.radar.rationale,
      expectedValueBand: record.radar.expectedValueBand,
      status: record.radar.status as any,
      ruleId: record.radar.ruleId,
      ruleVersion: record.radar.ruleVersion,
      detectedAt: record.radar.detectedAt.toISOString(),
      expiresAt: record.radar.expiresAt?.toISOString() || null,
      convertedOpportunityId: record.radar.convertedOpportunityId,
      convertedOpportunityCode: record.convertedOppCode || null,
      convertedOpportunityTitle: record.convertedOppTitle || null,
      existingOpportunityId: record.radar.existingOpportunityId,
      targetProductId: record.radar.targetProductId,
      targetProductCode: record.targetProductCode || null,
      targetProductName: record.targetProductName || null,
      dismissedReason: record.radar.dismissedReason,
      dismissedById: record.radar.dismissedById,
      dismissedByName: record.radar.dismissedByName,
      dismissedAt: record.radar.dismissedAt?.toISOString() || null,
      reviewedById: record.radar.reviewedById,
      reviewedByName: record.radar.reviewedByName,
      reviewedAt: record.radar.reviewedAt?.toISOString() || null,
      evidence: parsedEvidence,
      evidenceCount: parsedEvidence.length,
      dedupKey: record.radar.dedupKey,
      createdAt: record.radar.createdAt.toISOString(),
      updatedAt: record.radar.updatedAt.toISOString(),
    };
  },

  /**
   * Get comprehensive summary statistics for the Opportunity Radar Dashboard
   */
  async getSummaryStats(assignedRmId?: number): Promise<RadarSummaryStats> {
    const conditions = [];
    if (assignedRmId) {
      conditions.push(eq(customers.assignedRmId, assignedRmId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const allSignals = await db
      .select({
        status: customerOpportunityRadar.status,
        priority: customerOpportunityRadar.priority,
        signalType: customerOpportunityRadar.signalType,
        category: customerOpportunityRadar.category,
        expiresAt: customerOpportunityRadar.expiresAt,
        convertedOpportunityId: customerOpportunityRadar.convertedOpportunityId,
        updatedAt: customerOpportunityRadar.updatedAt,
      })
      .from(customerOpportunityRadar)
      .leftJoin(customers, eq(customerOpportunityRadar.customerId, customers.id))
      .where(whereClause);

    const now = new Date();
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalActive = 0;
    let highPriority = 0;
    let productGaps = 0;
    let relationshipOpps = 0;
    let expiringSoon = 0;
    let convertedThisMonth = 0;

    const signalsByCategory: Record<string, number> = {};
    const signalsBySignalType: Record<string, number> = {};

    for (const s of allSignals) {
      const isActive = s.status === 'DETECTED' || s.status === 'REVIEW_SUGGESTED';

      if (isActive) {
        totalActive++;
        if (s.priority === 'HIGH' || s.priority === 'CRITICAL') {
          highPriority++;
        }
        if (s.signalType === 'PRODUCT_COVERAGE_GAP') {
          productGaps++;
        }
        if (s.signalType === 'RELATIONSHIP_EXPANSION') {
          relationshipOpps++;
        }
        if (s.expiresAt && new Date(s.expiresAt) <= thirtyDaysAhead && new Date(s.expiresAt) >= now) {
          expiringSoon++;
        }

        signalsByCategory[s.category] = (signalsByCategory[s.category] || 0) + 1;
        signalsBySignalType[s.signalType] = (signalsBySignalType[s.signalType] || 0) + 1;
      }

      if (s.status === 'CONVERTED' && s.updatedAt && new Date(s.updatedAt) >= startOfMonth) {
        convertedThisMonth++;
      }
    }

    return {
      totalActiveSignals: totalActive,
      highPriorityCount: highPriority,
      productGapsCount: productGaps,
      relationshipOpportunitiesCount: relationshipOpps,
      expiringSoonCount: expiringSoon,
      convertedThisMonthCount: convertedThisMonth,
      signalsByCategory,
      signalsBySignalType,
    };
  },

  /**
   * Mark a Radar Signal as reviewed
   */
  async markReviewed(id: number, actorContext?: SafeActor): Promise<OpportunityRadarSignal> {
    const existing = await this.getSignalById(id);
    const now = new Date();

    await db
      .update(customerOpportunityRadar)
      .set({
        status: 'REVIEW_SUGGESTED',
        reviewedById: actorContext?.id || null,
        reviewedByName: actorContext?.name || 'Bank Officer',
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(customerOpportunityRadar.id, id));

    await db.insert(auditLogs).values({
      actorId: actorContext?.employeeId || String(actorContext?.id || 'SYSTEM'),
      actorName: actorContext?.name || 'Bank Officer',
      action: 'RADAR_REVIEWED',
      resourceType: 'RADAR_SIGNAL',
      resourceId: String(id),
      requestId: actorContext?.requestId || `REQ-RADAR-REV-${Date.now()}`,
      outcome: 'SUCCESS',
      metadata: JSON.stringify({
        radarId: existing.radarId,
        title: existing.title,
        customerId: existing.customerId,
      }),
    });

    return await this.getSignalById(id);
  },

  /**
   * Convert Radar Signal to a pipeline Opportunity (Manual decision by employee)
   */
  async convertToOpportunity(
    id: number,
    actorContext: SafeActor,
    opportunityInput: {
      title?: string;
      stage?: string;
      expectedValue?: string;
      probability?: number;
      expectedCloseDate?: string;
      notes?: string;
    }
  ): Promise<{ opportunity: any; radarSignal: OpportunityRadarSignal }> {
    const radar = await this.getSignalById(id);

    if (radar.status === 'CONVERTED' && radar.convertedOpportunityId) {
      throw new BankingError(
        `Radar signal #${id} has already been converted into Opportunity #${radar.convertedOpportunityId}`,
        'ALREADY_CONVERTED',
        400
      );
    }

    const title = opportunityInput.title?.trim() || radar.title;
    const stage = opportunityInput.stage || 'PROSPECT';
    const expectedValue = opportunityInput.expectedValue || '2500000.00';
    const probability = opportunityInput.probability || 40;

    // Create Opportunity in database
    const createdOpp = await opportunityRepository.create({
      customerId: radar.customerId,
      productId: radar.targetProductId || undefined,
      title,
      stage,
      expectedValue,
      probability,
      expectedCloseDate: opportunityInput.expectedCloseDate,
      notes:
        opportunityInput.notes ||
        `Origin: Converted from Opportunity Radar signal ${radar.radarId} (${radar.title}). Rationale: ${radar.rationale}`,
      assignedToId: actorContext.id,
    });

    const now = new Date();

    // Update Radar Signal status to CONVERTED
    await db
      .update(customerOpportunityRadar)
      .set({
        status: 'CONVERTED',
        convertedOpportunityId: createdOpp.id,
        updatedAt: now,
      })
      .where(eq(customerOpportunityRadar.id, id));

    // Audit log
    await db.insert(auditLogs).values({
      actorId: actorContext.employeeId || String(actorContext.id || 'SYSTEM'),
      actorName: actorContext.name || 'Bank Officer',
      action: 'RADAR_CONVERTED_TO_OPPORTUNITY',
      resourceType: 'RADAR_SIGNAL',
      resourceId: String(id),
      requestId: actorContext.requestId || `REQ-RADAR-CONV-${Date.now()}`,
      outcome: 'SUCCESS',
      metadata: JSON.stringify({
        radarId: radar.radarId,
        convertedOpportunityId: createdOpp.id,
        opportunityCode: createdOpp.opportunityCode,
        title,
        expectedValue,
      }),
    });

    const updatedSignal = await this.getSignalById(id);

    return {
      opportunity: createdOpp,
      radarSignal: updatedSignal,
    };
  },

  /**
   * Dismiss a Radar Signal with mandatory reason
   */
  async dismissSignal(
    id: number,
    actorContext: SafeActor,
    reason: string
  ): Promise<OpportunityRadarSignal> {
    if (!reason || !reason.trim()) {
      throw new BankingError('Dismissal reason is mandatory for audit compliance.', 'VALIDATION_ERROR', 400);
    }

    const radar = await this.getSignalById(id);
    const now = new Date();

    await db
      .update(customerOpportunityRadar)
      .set({
        status: 'DISMISSED',
        dismissedReason: reason.trim(),
        dismissedById: actorContext.id || null,
        dismissedByName: actorContext.name || 'Bank Officer',
        dismissedAt: now,
        updatedAt: now,
      })
      .where(eq(customerOpportunityRadar.id, id));

    await db.insert(auditLogs).values({
      actorId: actorContext.employeeId || String(actorContext.id || 'SYSTEM'),
      actorName: actorContext.name || 'Bank Officer',
      action: 'RADAR_DISMISSED',
      resourceType: 'RADAR_SIGNAL',
      resourceId: String(id),
      requestId: actorContext.requestId || `REQ-RADAR-DISM-${Date.now()}`,
      outcome: 'SUCCESS',
      metadata: JSON.stringify({
        radarId: radar.radarId,
        title: radar.title,
        reason: reason.trim(),
        customerId: radar.customerId,
      }),
    });

    return await this.getSignalById(id);
  },
};
