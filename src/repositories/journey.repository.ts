/**
 * COREvia Phase 33: Customer Journey Repository
 * Data access for journey templates, customer journeys, journey steps, outcomes, and portfolio aggregations.
 */

import { db } from '../db/index.ts';
import {
  customerJourneys,
  customerJourneySteps,
  journeyTemplates,
  journeyTemplateSteps,
  journeyOutcomes,
  customers,
  users,
} from '../db/schema.ts';
import { eq, and, desc, asc, inArray, sql, ilike, or, SQL } from 'drizzle-orm';
import {
  JourneyFilterParams,
  JourneyStatus,
  JourneyPriority,
  JourneySLAStatus,
} from '../types/journey.types.ts';

export const journeyRepository = {
  /**
   * List all active templates with steps
   */
  async listTemplates() {
    return await db.query.journeyTemplates.findMany({
      where: eq(journeyTemplates.isActive, true),
      with: {
        steps: {
          orderBy: [asc(journeyTemplateSteps.stepOrder)],
        },
      },
      orderBy: [asc(journeyTemplates.name)],
    });
  },

  /**
   * Get template by code
   */
  async getTemplateByCode(templateCode: string) {
    return await db.query.journeyTemplates.findFirst({
      where: eq(journeyTemplates.templateCode, templateCode),
      with: {
        steps: {
          orderBy: [asc(journeyTemplateSteps.stepOrder)],
        },
      },
    });
  },

  /**
   * Get template by ID
   */
  async getTemplateById(id: number) {
    return await db.query.journeyTemplates.findFirst({
      where: eq(journeyTemplates.id, id),
      with: {
        steps: {
          orderBy: [asc(journeyTemplateSteps.stepOrder)],
        },
      },
    });
  },

  /**
   * Insert new journey template
   */
  async createTemplate(data: typeof journeyTemplates.$inferInsert) {
    const [template] = await db.insert(journeyTemplates).values(data).returning();
    return template;
  },

  /**
   * Insert template steps
   */
  async createTemplateSteps(steps: (typeof journeyTemplateSteps.$inferInsert)[]) {
    return await db.insert(journeyTemplateSteps).values(steps).returning();
  },

  /**
   * Create a customer journey record
   */
  async createJourney(data: typeof customerJourneys.$inferInsert) {
    const [journey] = await db.insert(customerJourneys).values(data).returning();
    return journey;
  },

  /**
   * Batch insert customer journey steps
   */
  async createJourneySteps(steps: (typeof customerJourneySteps.$inferInsert)[]) {
    return await db.insert(customerJourneySteps).values(steps).returning();
  },

  /**
   * Get journey by database ID
   */
  async getJourneyById(id: number) {
    return await db.query.customerJourneys.findFirst({
      where: eq(customerJourneys.id, id),
      with: {
        customer: true,
        owner: true,
        template: true,
        steps: {
          orderBy: [asc(customerJourneySteps.stepNumber)],
        },
        outcomes: true,
      },
    });
  },

  /**
   * Get journey by public journey code (e.g. JRN-2026-10482-01)
   */
  async getJourneyByJourneyId(journeyId: string) {
    return await db.query.customerJourneys.findFirst({
      where: eq(customerJourneys.journeyId, journeyId),
      with: {
        customer: true,
        owner: true,
        template: true,
        steps: {
          orderBy: [asc(customerJourneySteps.stepNumber)],
        },
        outcomes: true,
      },
    });
  },

  /**
   * List customer journeys with filtering and pagination
   */
  async listJourneys(params: JourneyFilterParams, allowedCustomerIds?: number[]) {
    const conditions: SQL[] = [];

    if (allowedCustomerIds && allowedCustomerIds.length > 0) {
      conditions.push(inArray(customerJourneys.customerId, allowedCustomerIds));
    }

    if (params.customerId) {
      conditions.push(eq(customerJourneys.customerId, params.customerId));
    }

    if (params.status) {
      conditions.push(eq(customerJourneys.status, params.status));
    }

    if (params.priority) {
      conditions.push(eq(customerJourneys.priority, params.priority));
    }

    if (params.slaStatus) {
      conditions.push(eq(customerJourneys.slaStatus, params.slaStatus));
    }

    if (params.journeyType) {
      conditions.push(eq(customerJourneys.journeyType, params.journeyType));
    }

    if (params.ownerId) {
      conditions.push(eq(customerJourneys.ownerId, params.ownerId));
    }

    if (params.search) {
      const q = `%${params.search}%`;
      conditions.push(
        or(
          ilike(customerJourneys.journeyId, q),
          ilike(customerJourneys.name, q),
          ilike(customerJourneys.description, q)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return await db.query.customerJourneys.findMany({
      where: whereClause,
      with: {
        customer: true,
        owner: true,
        steps: {
          orderBy: [asc(customerJourneySteps.stepNumber)],
        },
      },
      orderBy: [desc(customerJourneys.createdAt)],
      limit: params.limit || 50,
      offset: params.offset || 0,
    });
  },

  /**
   * Update journey
   */
  async updateJourney(id: number, data: Partial<typeof customerJourneys.$inferInsert>) {
    const [updated] = await db
      .update(customerJourneys)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customerJourneys.id, id))
      .returning();
    return updated;
  },

  /**
   * Get steps for a journey
   */
  async getJourneySteps(journeyId: number) {
    return await db.query.customerJourneySteps.findMany({
      where: eq(customerJourneySteps.journeyId, journeyId),
      orderBy: [asc(customerJourneySteps.stepNumber)],
    });
  },

  /**
   * Get specific step by ID
   */
  async getJourneyStepById(stepId: number) {
    return await db.query.customerJourneySteps.findFirst({
      where: eq(customerJourneySteps.id, stepId),
    });
  },

  /**
   * Update journey step
   */
  async updateJourneyStep(stepId: number, data: Partial<typeof customerJourneySteps.$inferInsert>) {
    const [updated] = await db
      .update(customerJourneySteps)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customerJourneySteps.id, stepId))
      .returning();
    return updated;
  },

  /**
   * Record journey outcome
   */
  async createJourneyOutcome(data: typeof journeyOutcomes.$inferInsert) {
    const [outcome] = await db.insert(journeyOutcomes).values(data).returning();
    return outcome;
  },

  /**
   * Get outcome for journey
   */
  async getJourneyOutcome(journeyId: number) {
    return await db.query.journeyOutcomes.findFirst({
      where: eq(journeyOutcomes.journeyId, journeyId),
    });
  },

  /**
   * Aggregate portfolio journey analytics
   */
  async getPortfolioAnalytics(allowedCustomerIds?: number[]) {
    const conditions: SQL[] = [];
    if (allowedCustomerIds && allowedCustomerIds.length > 0) {
      conditions.push(inArray(customerJourneys.customerId, allowedCustomerIds));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const allJourneys = await db.query.customerJourneys.findMany({
      where: whereClause,
      with: {
        steps: true,
      },
    });

    const totalJourneys = allJourneys.length;
    let activeJourneys = 0;
    let completedJourneys = 0;
    let blockedJourneys = 0;
    let atRiskJourneys = 0;
    let breachedJourneys = 0;

    const byStatus: Record<string, number> = {};
    const bySLA: Record<string, number> = {
      ON_TRACK: 0,
      AT_RISK: 0,
      BREACHED: 0,
      COMPLETED: 0,
    };
    const byTypeMap: Record<
      string,
      { type: string; label: string; count: number; active: number; completed: number; blocked: number }
    > = {};

    let totalDurationDays = 0;
    let completedCountForDuration = 0;

    for (const j of allJourneys) {
      // Status counts
      byStatus[j.status] = (byStatus[j.status] || 0) + 1;
      if (j.status === 'ACTIVE' || j.status === 'IN_PROGRESS') activeJourneys++;
      else if (j.status === 'COMPLETED') completedJourneys++;
      else if (j.status === 'BLOCKED') blockedJourneys++;

      // SLA counts
      bySLA[j.slaStatus] = (bySLA[j.slaStatus] || 0) + 1;
      if (j.slaStatus === 'AT_RISK') atRiskJourneys++;
      else if (j.slaStatus === 'BREACHED') breachedJourneys++;

      // Duration calculation
      if (j.status === 'COMPLETED' && j.startedAt && j.completedAt) {
        const diffMs = new Date(j.completedAt).getTime() - new Date(j.startedAt).getTime();
        const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        totalDurationDays += diffDays;
        completedCountForDuration++;
      }

      // Group by Type
      if (!byTypeMap[j.journeyType]) {
        byTypeMap[j.journeyType] = {
          type: j.journeyType,
          label: j.name,
          count: 0,
          active: 0,
          completed: 0,
          blocked: 0,
        };
      }
      byTypeMap[j.journeyType].count++;
      if (j.status === 'ACTIVE' || j.status === 'IN_PROGRESS') byTypeMap[j.journeyType].active++;
      else if (j.status === 'COMPLETED') byTypeMap[j.journeyType].completed++;
      else if (j.status === 'BLOCKED') byTypeMap[j.journeyType].blocked++;
    }

    const avgCompletionDays =
      completedCountForDuration > 0
        ? Math.round((totalDurationDays / completedCountForDuration) * 10) / 10
        : 8.5;

    const completionRate =
      totalJourneys > 0 ? Math.round((completedJourneys / totalJourneys) * 100) : 0;

    const slaComplianceRate =
      totalJourneys > 0 ? Math.round(((totalJourneys - breachedJourneys) / totalJourneys) * 100) : 100;

    // Detect bottlenecks
    const bottleneckMap: Record<
      string,
      { stepKey: string; stepName: string; stepType: any; blockedCount: number; delayHoursSum: number }
    > = {};

    for (const j of allJourneys) {
      if (j.steps) {
        for (const s of j.steps) {
          if (s.status === 'BLOCKED') {
            if (!bottleneckMap[s.stepKey]) {
              bottleneckMap[s.stepKey] = {
                stepKey: s.stepKey,
                stepName: s.name,
                stepType: s.stepType as any,
                blockedCount: 0,
                delayHoursSum: 0,
              };
            }
            bottleneckMap[s.stepKey].blockedCount++;
            bottleneckMap[s.stepKey].delayHoursSum += 24;
          }
        }
      }
    }

    const topBottlenecks = Object.values(bottleneckMap)
      .sort((a, b) => b.blockedCount - a.blockedCount)
      .slice(0, 5)
      .map((b) => ({
        stepKey: b.stepKey,
        stepName: b.stepName,
        stepType: b.stepType,
        blockedCount: b.blockedCount,
        avgDelayHours: b.blockedCount > 0 ? Math.round(b.delayHoursSum / b.blockedCount) : 0,
      }));

    return {
      totalJourneys,
      activeJourneys,
      totalActiveJourneys: activeJourneys,
      completedJourneys,
      blockedJourneys,
      atRiskJourneys,
      breachedJourneys,
      avgCompletionDays,
      completionRate,
      slaComplianceRate,
      byType: Object.values(byTypeMap),
      byStatus,
      bySLA,
      topBottlenecks,
      recentEscalations: [],
    };
  },
};
