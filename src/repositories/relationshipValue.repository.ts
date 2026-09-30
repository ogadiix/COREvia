/**
 * COREvia Phase 32: Relationship Value Repository
 * Manages database persistence for relationship value snapshots, historical timelines, and portfolio aggregations.
 */

import { db } from '../db/index.ts';
import {
  relationshipValueSnapshots,
  customers,
  users,
} from '../db/schema.ts';
import { eq, desc, and, gte, sql, inArray } from 'drizzle-orm';
import {
  RelationshipValueSnapshotDTO,
  PortfolioValueDistributionBucket,
  PortfolioSegmentMetric,
  PortfolioRelationshipValueAnalyticsDTO,
} from '../types/relationshipValue.types.ts';

export const relationshipValueRepository = {
  /**
   * Persist a relationship value snapshot
   */
  async createSnapshot(data: {
    customerId: number;
    snapshotDate?: string;
    relationshipValue: number | string;
    coreScore: number;
    productDepth: number;
    engagement: number;
    serviceHealth: string;
    relationshipMomentum: string;
    opportunityCoverage: number;
    commitmentHealth: number;
    activityHealth: number;
    relationshipState: string;
    sourceVersion?: string;
    scenarioId?: string | null;
    decisionTraceId?: string | null;
    metadata?: Record<string, any>;
  }): Promise<RelationshipValueSnapshotDTO> {
    const today = data.snapshotDate || new Date().toISOString().split('T')[0];

    const [inserted] = await db
      .insert(relationshipValueSnapshots)
      .values({
        customerId: data.customerId,
        snapshotDate: today,
        relationshipValue: String(data.relationshipValue || 0),
        coreScore: data.coreScore,
        productDepth: data.productDepth,
        engagement: data.engagement,
        serviceHealth: data.serviceHealth,
        relationshipMomentum: data.relationshipMomentum,
        opportunityCoverage: String(data.opportunityCoverage || 0),
        commitmentHealth: String(data.commitmentHealth || 0),
        activityHealth: String(data.activityHealth || 0),
        relationshipState: data.relationshipState,
        sourceVersion: data.sourceVersion || '1.0',
        scenarioId: data.scenarioId ?? null,
        decisionTraceId: data.decisionTraceId ?? null,
        metadata: data.metadata ?? {},
      })
      .returning();

    // Fetch customer details
    const [cust] = await db
      .select({ customerCode: customers.customerCode, name: customers.name })
      .from(customers)
      .where(eq(customers.id, data.customerId))
      .limit(1);

    const relValNum = parseFloat(String(inserted.relationshipValue));

    return {
      id: inserted.id,
      customerId: inserted.customerId,
      customerCode: cust?.customerCode || `CUS-${inserted.customerId}`,
      customerName: cust?.name || 'Customer',
      capturedAt: inserted.createdAt.toISOString(),
      snapshotDate: inserted.snapshotDate,
      relationshipValue: relValNum,
      relationshipValueFormatted: `₹${(relValNum / 100000).toFixed(1)}L`,
      coreScore: inserted.coreScore,
      productDepth: inserted.productDepth,
      engagement: inserted.engagement,
      serviceHealth: inserted.serviceHealth as any,
      relationshipMomentum: inserted.relationshipMomentum as any,
      opportunityCoverage: parseFloat(String(inserted.opportunityCoverage)),
      commitmentHealth: parseFloat(String(inserted.commitmentHealth)),
      activityHealth: parseFloat(String(inserted.activityHealth)),
      relationshipState: inserted.relationshipState,
      sourceVersion: inserted.sourceVersion,
      sourceMetadata: (inserted.metadata as Record<string, string>) || {},
      dataAsOf: inserted.createdAt.toISOString(),
      scenarioId: inserted.scenarioId,
      decisionTraceId: inserted.decisionTraceId,
    };
  },

  /**
   * Get latest snapshot for a customer
   */
  async getLatestSnapshot(customerId: number): Promise<RelationshipValueSnapshotDTO | null> {
    const [row] = await db
      .select({
        snapshot: relationshipValueSnapshots,
        customerCode: customers.customerCode,
        customerName: customers.name,
      })
      .from(relationshipValueSnapshots)
      .innerJoin(customers, eq(relationshipValueSnapshots.customerId, customers.id))
      .where(eq(relationshipValueSnapshots.customerId, customerId))
      .orderBy(desc(relationshipValueSnapshots.createdAt))
      .limit(1);

    if (!row) return null;

    const relValNum = parseFloat(String(row.snapshot.relationshipValue));

    return {
      id: row.snapshot.id,
      customerId: row.snapshot.customerId,
      customerCode: row.customerCode,
      customerName: row.customerName,
      capturedAt: row.snapshot.createdAt.toISOString(),
      snapshotDate: row.snapshot.snapshotDate,
      relationshipValue: relValNum,
      relationshipValueFormatted: `₹${(relValNum / 100000).toFixed(1)}L`,
      coreScore: row.snapshot.coreScore,
      productDepth: row.snapshot.productDepth,
      engagement: row.snapshot.engagement,
      serviceHealth: row.snapshot.serviceHealth as any,
      relationshipMomentum: row.snapshot.relationshipMomentum as any,
      opportunityCoverage: parseFloat(String(row.snapshot.opportunityCoverage)),
      commitmentHealth: parseFloat(String(row.snapshot.commitmentHealth)),
      activityHealth: parseFloat(String(row.snapshot.activityHealth)),
      relationshipState: row.snapshot.relationshipState,
      sourceVersion: row.snapshot.sourceVersion,
      sourceMetadata: (row.snapshot.metadata as Record<string, string>) || {},
      dataAsOf: row.snapshot.createdAt.toISOString(),
      scenarioId: row.snapshot.scenarioId,
      decisionTraceId: row.snapshot.decisionTraceId,
    };
  },

  /**
   * Retrieve historical snapshots for a customer up to daysAgo (default 90)
   */
  async getHistoricalSnapshots(customerId: number, days = 90): Promise<RelationshipValueSnapshotDTO[]> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const rows = await db
      .select({
        snapshot: relationshipValueSnapshots,
        customerCode: customers.customerCode,
        customerName: customers.name,
      })
      .from(relationshipValueSnapshots)
      .innerJoin(customers, eq(relationshipValueSnapshots.customerId, customers.id))
      .where(
        and(
          eq(relationshipValueSnapshots.customerId, customerId),
          gte(relationshipValueSnapshots.snapshotDate, cutoffDate)
        )
      )
      .orderBy(desc(relationshipValueSnapshots.snapshotDate), desc(relationshipValueSnapshots.createdAt))
      .limit(50);

    return rows.map((r) => {
      const relValNum = parseFloat(String(r.snapshot.relationshipValue));
      return {
        id: r.snapshot.id,
        customerId: r.snapshot.customerId,
        customerCode: r.customerCode,
        customerName: r.customerName,
        capturedAt: r.snapshot.createdAt.toISOString(),
        snapshotDate: r.snapshot.snapshotDate,
        relationshipValue: relValNum,
        relationshipValueFormatted: `₹${(relValNum / 100000).toFixed(1)}L`,
        coreScore: r.snapshot.coreScore,
        productDepth: r.snapshot.productDepth,
        engagement: r.snapshot.engagement,
        serviceHealth: r.snapshot.serviceHealth as any,
        relationshipMomentum: r.snapshot.relationshipMomentum as any,
        opportunityCoverage: parseFloat(String(r.snapshot.opportunityCoverage)),
        commitmentHealth: parseFloat(String(r.snapshot.commitmentHealth)),
        activityHealth: parseFloat(String(r.snapshot.activityHealth)),
        relationshipState: r.snapshot.relationshipState,
        sourceVersion: r.snapshot.sourceVersion,
        sourceMetadata: (r.snapshot.metadata as Record<string, string>) || {},
        dataAsOf: r.snapshot.createdAt.toISOString(),
        scenarioId: r.snapshot.scenarioId,
        decisionTraceId: r.snapshot.decisionTraceId,
      };
    });
  },

  /**
   * Aggregate Portfolio-level metrics across authorized customers
   */
  async getPortfolioAggregation(authorizedCustomerIds?: number[]): Promise<PortfolioRelationshipValueAnalyticsDTO> {
    const custConditions = [];
    if (authorizedCustomerIds && authorizedCustomerIds.length > 0) {
      custConditions.push(inArray(customers.id, authorizedCustomerIds));
    }

    const whereClause = custConditions.length > 0 ? and(...custConditions) : undefined;

    // Fetch authorized customer baseline
    const custList = await db
      .select({
        id: customers.id,
        code: customers.customerCode,
        name: customers.name,
        entityType: customers.entityType,
        relationshipValue: customers.relationshipValue,
        assignedRmId: customers.assignedRmId,
      })
      .from(customers)
      .where(whereClause);

    const totalCustomers = custList.length;
    let totalPortfolioVal = 0;
    const tierMap = {
      HIGH: { count: 0, val: 0, scores: [] as number[], prods: [] as number[], engs: [] as number[] },
      MEDIUM: { count: 0, val: 0, scores: [] as number[], prods: [] as number[], engs: [] as number[] },
      LOW: { count: 0, val: 0, scores: [] as number[], prods: [] as number[], engs: [] as number[] },
    };

    // Parallel fetch recent snapshots to get latest scores
    const custIds = custList.map(c => c.id);
    const recentSnapshots = custIds.length > 0
      ? await db
          .select()
          .from(relationshipValueSnapshots)
          .where(inArray(relationshipValueSnapshots.customerId, custIds))
          .orderBy(desc(relationshipValueSnapshots.createdAt))
      : [];

    const latestByCust = new Map<number, typeof recentSnapshots[0]>();
    for (const snap of recentSnapshots) {
      if (!latestByCust.has(snap.customerId)) {
        latestByCust.set(snap.customerId, snap);
      }
    }

    let sumCore = 0;
    let sumProd = 0;
    let sumEng = 0;
    let sumOppCov = 0;

    for (const c of custList) {
      const val = parseFloat(String(c.relationshipValue || 0));
      totalPortfolioVal += val;

      const snap = latestByCust.get(c.id);
      const score = snap?.coreScore ?? 75;
      const prod = snap?.productDepth ?? 4;
      const eng = snap?.engagement ?? 65;
      const oppCov = parseFloat(String(snap?.opportunityCoverage ?? 60));

      sumCore += score;
      sumProd += prod;
      sumEng += eng;
      sumOppCov += oppCov;

      // Tier segmentation: High (> 50L), Med (15L - 50L), Low (< 15L)
      if (val >= 5000000) {
        tierMap.HIGH.count++;
        tierMap.HIGH.val += val;
        tierMap.HIGH.scores.push(score);
        tierMap.HIGH.prods.push(prod);
        tierMap.HIGH.engs.push(eng);
      } else if (val >= 1500000) {
        tierMap.MEDIUM.count++;
        tierMap.MEDIUM.val += val;
        tierMap.MEDIUM.scores.push(score);
        tierMap.MEDIUM.prods.push(prod);
        tierMap.MEDIUM.engs.push(eng);
      } else {
        tierMap.LOW.count++;
        tierMap.LOW.val += val;
        tierMap.LOW.scores.push(score);
        tierMap.LOW.prods.push(prod);
        tierMap.LOW.engs.push(eng);
      }
    }

    const calcAvg = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);

    const distributionTiers: PortfolioValueDistributionBucket[] = [
      {
        tier: 'HIGH',
        label: 'High Relationship Value',
        rangeLabel: '≥ ₹50 Lakhs',
        customerCount: tierMap.HIGH.count,
        totalValue: tierMap.HIGH.val,
        totalValueFormatted: `₹${(tierMap.HIGH.val / 100000).toFixed(1)}L`,
        avgCoreScore: calcAvg(tierMap.HIGH.scores),
        avgProductDepth: calcAvg(tierMap.HIGH.prods),
        avgEngagement: calcAvg(tierMap.HIGH.engs),
      },
      {
        tier: 'MEDIUM',
        label: 'Medium Relationship Value',
        rangeLabel: '₹15L – ₹50L',
        customerCount: tierMap.MEDIUM.count,
        totalValue: tierMap.MEDIUM.val,
        totalValueFormatted: `₹${(tierMap.MEDIUM.val / 100000).toFixed(1)}L`,
        avgCoreScore: calcAvg(tierMap.MEDIUM.scores),
        avgProductDepth: calcAvg(tierMap.MEDIUM.prods),
        avgEngagement: calcAvg(tierMap.MEDIUM.engs),
      },
      {
        tier: 'LOW',
        label: 'Foundation / Standard Value',
        rangeLabel: '< ₹15 Lakhs',
        customerCount: tierMap.LOW.count,
        totalValue: tierMap.LOW.val,
        totalValueFormatted: `₹${(tierMap.LOW.val / 100000).toFixed(1)}L`,
        avgCoreScore: calcAvg(tierMap.LOW.scores),
        avgProductDepth: calcAvg(tierMap.LOW.prods),
        avgEngagement: calcAvg(tierMap.LOW.engs),
      },
    ];

    // Build segments by Customer Type
    const typeGroups = new Map<string, typeof custList>();
    for (const c of custList) {
      const type = c.entityType || 'INDIVIDUAL';
      if (!typeGroups.has(type)) typeGroups.set(type, []);
      typeGroups.get(type)!.push(c);
    }

    const segmentsByCustomerType: PortfolioSegmentMetric[] = [];
    for (const [type, group] of typeGroups.entries()) {
      let gVal = 0;
      const gScores: number[] = [];
      const gProds: number[] = [];
      const gEngs: number[] = [];
      const gOpps: number[] = [];

      for (const gc of group) {
        const val = parseFloat(String(gc.relationshipValue || 0));
        gVal += val;
        const snap = latestByCust.get(gc.id);
        gScores.push(snap?.coreScore ?? 75);
        gProds.push(snap?.productDepth ?? 4);
        gEngs.push(snap?.engagement ?? 65);
        gOpps.push(parseFloat(String(snap?.opportunityCoverage ?? 60)));
      }

      segmentsByCustomerType.push({
        segmentKey: type,
        segmentLabel: type.replace('_', ' '),
        customerCount: group.length,
        totalRelationshipValue: gVal,
        totalValueFormatted: `₹${(gVal / 100000).toFixed(1)}L`,
        avgCoreScore: calcAvg(gScores),
        avgProductDepth: calcAvg(gProds),
        avgEngagement: calcAvg(gEngs),
        avgOpportunityCoverage: calcAvg(gOpps),
        dominantServiceHealth: 'GOOD',
        serviceHealthBreakdown: { excellent: 1, good: Math.max(1, group.length - 1), fair: 0, critical: 0 },
      });
    }

    const serviceHealthCounts = { excellent: 0, good: 0, fair: 0, critical: 0 };
    for (const c of custList) {
      const snap = latestByCust.get(c.id);
      const sh = (snap?.serviceHealth || 'GOOD').toLowerCase();
      if (sh === 'excellent') serviceHealthCounts.excellent++;
      else if (sh === 'fair') serviceHealthCounts.fair++;
      else if (sh === 'critical') serviceHealthCounts.critical++;
      else serviceHealthCounts.good++;
    }

    const drilldownList = custList.map((c) => {
      const snap = latestByCust.get(c.id);
      const val = parseFloat(String(c.relationshipValue || 0));
      return {
        id: c.id,
        customerCode: c.code,
        customerName: c.name,
        segment: c.entityType || 'INDIVIDUAL',
        rmName: 'Dedicated RM',
        relationshipValue: val,
        relationshipValueFormatted: `₹${(val / 100000).toFixed(1)}L`,
        coreScore: snap?.coreScore ?? 75,
        productDepth: snap?.productDepth ?? 4,
        engagement: snap?.engagement ?? 65,
        serviceHealth: snap?.serviceHealth || 'GOOD',
        momentum: snap?.relationshipMomentum || 'STABLE',
      };
    });

    const overallAverages = {
      avgCoreScore: totalCustomers ? Math.round(sumCore / totalCustomers) : 0,
      avgProductDepth: totalCustomers ? Math.round(sumProd / totalCustomers) : 0,
      avgEngagement: totalCustomers ? Math.round(sumEng / totalCustomers) : 0,
      avgOpportunityCoverage: totalCustomers ? Math.round(sumOppCov / totalCustomers) : 0,
    };

    return {
      totalCustomers,
      totalPortfolioValue: totalPortfolioVal,
      totalPortfolioValueFormatted: `₹${(totalPortfolioVal / 100000).toFixed(1)}L`,
      avgCoreScore: overallAverages.avgCoreScore,
      avgProductDepth: overallAverages.avgProductDepth,
      avgEngagement: overallAverages.avgEngagement,
      avgOpportunityCoverage: overallAverages.avgOpportunityCoverage,
      overallAverages,
      serviceHealthDistribution: serviceHealthCounts,
      distributionTiers,
      valueDistribution: distributionTiers,
      segments: segmentsByCustomerType,
      segmentsByRM: [],
      segmentsByBranch: [],
      segmentsByCustomerType,
      drilldownList,
      generatedAt: new Date().toISOString(),
    };
  },

  /**
   * Search snapshots by scenarioId, decisionTraceId, or numeric snapshot id with RBAC
   */
  async searchSnapshots(query: string, user: { id: number; role: string }): Promise<any[]> {
    const cleanQ = query.trim();
    if (!cleanQ) return [];

    let custFilter = undefined;
    if (user.role === 'RELATIONSHIP_MANAGER') {
      const rmCusts = await db.select({ id: customers.id }).from(customers).where(eq(customers.assignedRmId, user.id));
      const ids = rmCusts.map((c) => c.id);
      if (ids.length === 0) return [];
      custFilter = inArray(relationshipValueSnapshots.customerId, ids);
    }

    const numId = parseInt(cleanQ.replace(/[^0-9]/g, ''), 10);
    const conditions = [];
    conditions.push(sql`${relationshipValueSnapshots.scenarioId} ILIKE ${`%${cleanQ}%`}`);
    conditions.push(sql`${relationshipValueSnapshots.decisionTraceId} ILIKE ${`%${cleanQ}%`}`);
    if (!isNaN(numId)) {
      conditions.push(eq(relationshipValueSnapshots.id, numId));
    }

    const orCondition = sql`(${sql.join(conditions, sql` OR `)})`;
    const whereClause = custFilter ? and(custFilter, orCondition) : orCondition;

    const records = await db
      .select({
        id: relationshipValueSnapshots.id,
        customerId: relationshipValueSnapshots.customerId,
        snapshotDate: relationshipValueSnapshots.snapshotDate,
        scenarioId: relationshipValueSnapshots.scenarioId,
        decisionTraceId: relationshipValueSnapshots.decisionTraceId,
        coreScore: relationshipValueSnapshots.coreScore,
        serviceHealth: relationshipValueSnapshots.serviceHealth,
        relationshipMomentum: relationshipValueSnapshots.relationshipMomentum,
        createdAt: relationshipValueSnapshots.createdAt,
      })
      .from(relationshipValueSnapshots)
      .where(whereClause)
      .limit(10);

    return records.map((r) => ({
      id: `RVS-${r.id}`,
      snapshotId: r.id,
      title: r.scenarioId ? `Relationship Snapshot (${r.scenarioId})` : `Snapshot #${r.id} (${r.snapshotDate})`,
      customerId: r.customerId,
      scenarioId: r.scenarioId,
      decisionTraceId: r.decisionTraceId,
      coreScore: r.coreScore,
      serviceHealth: r.serviceHealth,
      createdAt: r.createdAt,
    }));
  },
};
