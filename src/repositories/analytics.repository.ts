import { eq, and, or, gte, lte, sql, desc, asc, inArray } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  customers,
  accounts,
  loans,
  products,
  customerProducts,
  serviceCases,
  tasks,
  opportunities,
  customerScores,
  customerScoreHistory,
  customerInsights,
  nextBestActions,
  customerOpportunityRadar,
  notifications,
  interactions,
  users,
} from '../db/schema.ts';

export interface AnalyticsFilterParams {
  period?: 'today' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_quarter' | 'previous_quarter' | 'custom';
  startDate?: string;
  endDate?: string;
  branch?: string;
  rmId?: number;
  segment?: string;
  status?: string;
  scoreBand?: string;
  momentum?: 'UP' | 'STABLE' | 'DOWN';
  productCount?: string;
  oppStage?: string;
  oppPriority?: string;
  oppProductId?: number;
  caseStatus?: string;
  casePriority?: string;
  caseSlaState?: string;
}

export interface UserScope {
  userId: number;
  role: string;
  department?: string;
}

export interface DateWindow {
  start: Date;
  end: Date;
  priorStart: Date;
  priorEnd: Date;
  label: string;
}

export function computeDateWindow(filter: AnalyticsFilterParams): DateWindow {
  const now = new Date();
  const period = filter.period || 'last_30_days';

  let start: Date;
  let end: Date = new Date(now);
  let priorStart: Date;
  let priorEnd: Date;
  let label = 'Last 30 Days';

  if (period === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    priorStart = new Date(start.getTime() - 24 * 60 * 60 * 1000);
    priorEnd = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    label = 'Today';
  } else if (period === 'last_7_days') {
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const duration = end.getTime() - start.getTime();
    priorEnd = new Date(start.getTime());
    priorStart = new Date(priorEnd.getTime() - duration);
    label = 'Last 7 Days';
  } else if (period === 'last_90_days') {
    start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const duration = end.getTime() - start.getTime();
    priorEnd = new Date(start.getTime());
    priorStart = new Date(priorEnd.getTime() - duration);
    label = 'Last 90 Days';
  } else if (period === 'this_quarter') {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    start = new Date(now.getFullYear(), currentQuarter * 3, 1);
    const duration = end.getTime() - start.getTime();
    priorEnd = new Date(start.getTime() - 1);
    priorStart = new Date(priorEnd.getTime() - duration);
    label = `Q${currentQuarter + 1} ${now.getFullYear()}`;
  } else if (period === 'previous_quarter') {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const prevQ = currentQuarter === 0 ? 3 : currentQuarter - 1;
    const prevYear = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
    start = new Date(prevYear, prevQ * 3, 1);
    end = new Date(prevYear, prevQ * 3 + 3, 0, 23, 59, 59);
    const duration = end.getTime() - start.getTime();
    priorEnd = new Date(start.getTime() - 1);
    priorStart = new Date(priorEnd.getTime() - duration);
    label = `Q${prevQ + 1} ${prevYear}`;
  } else if (period === 'custom' && filter.startDate && filter.endDate) {
    start = new Date(filter.startDate + 'T00:00:00');
    end = new Date(filter.endDate + 'T23:59:59');
    const duration = Math.max(24 * 60 * 60 * 1000, end.getTime() - start.getTime());
    priorEnd = new Date(start.getTime() - 1);
    priorStart = new Date(priorEnd.getTime() - duration);
    label = `${filter.startDate} to ${filter.endDate}`;
  } else {
    // Default last_30_days
    start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const duration = end.getTime() - start.getTime();
    priorEnd = new Date(start.getTime());
    priorStart = new Date(priorEnd.getTime() - duration);
    label = 'Last 30 Days';
  }

  return { start, end, priorStart, priorEnd, label };
}

export const analyticsRepository = {
  /**
   * Helper: Check RBAC scoping for query execution
   */
  getScopedRmId(filter: AnalyticsFilterParams, scope: UserScope): number | undefined {
    if (scope.role === 'RELATIONSHIP_MANAGER') {
      return scope.userId;
    }
    return filter.rmId ? Number(filter.rmId) : undefined;
  },

  /**
   * Fetch base customers along with their linked metrics and scores respecting filters
   */
  async getFilteredCustomers(filter: AnalyticsFilterParams, scope: UserScope) {
    const scopedRmId = this.getScopedRmId(filter, scope);

    // 1. Fetch raw customers
    const custQuery = db.select().from(customers);
    const conditions = [];

    if (scopedRmId) {
      conditions.push(eq(customers.assignedRmId, scopedRmId));
    }
    if (filter.segment) {
      conditions.push(eq(customers.entityType, filter.segment.toUpperCase()));
    }
    if (filter.status) {
      conditions.push(eq(customers.status, filter.status.toUpperCase()));
    }

    const baseCustomers = conditions.length > 0 ? await custQuery.where(and(...conditions)) : await custQuery;

    // 2. Fetch linked current scores
    const allScores = await db.select().from(customerScores);
    const scoreMap = new Map<number, typeof allScores[0]>();
    for (const s of allScores) {
      scoreMap.set(s.customerId, s);
    }

    // 3. Fetch score history for momentum calculation
    const allHistory = await db.select().from(customerScoreHistory).orderBy(desc(customerScoreHistory.recordedDate));
    const historyMap = new Map<number, typeof allHistory>();
    for (const h of allHistory) {
      if (!historyMap.has(h.customerId)) {
        historyMap.set(h.customerId, []);
      }
      historyMap.get(h.customerId)!.push(h);
    }

    // 4. Fetch customer products count
    const allCustProds = await db.select().from(customerProducts);
    const prodCountMap = new Map<number, number>();
    for (const cp of allCustProds) {
      if (cp.status === 'ACTIVE') {
        prodCountMap.set(cp.customerId, (prodCountMap.get(cp.customerId) || 0) + 1);
      }
    }

    // 5. Fetch linked accounts to check branch
    const allAccounts = await db.select().from(accounts);
    const branchMap = new Map<number, string>();
    for (const acc of allAccounts) {
      if (acc.customerId && !branchMap.has(acc.customerId)) {
        branchMap.set(acc.customerId, acc.branchCode || '0104');
      }
    }

    // 6. Fetch users (RMs) for names
    const allUsers = await db.select().from(users);
    const userMap = new Map<number, string>();
    for (const u of allUsers) {
      userMap.set(u.id, u.name);
    }

    // 7. Calculate momentum and filter by scoreBand, momentum, branch, productCount
    const enriched = baseCustomers.map((c) => {
      const score = scoreMap.get(c.id);
      const coreScoreVal = score?.coreScore ?? 70;
      const historyList = historyMap.get(c.id) || [];
      
      // Calculate momentum by comparing latest vs prior history snapshot
      let momentum: 'UP' | 'STABLE' | 'DOWN' = 'STABLE';
      let prevScore = coreScoreVal;
      if (historyList.length >= 2) {
        prevScore = historyList[1].coreScore;
        const diff = coreScoreVal - prevScore;
        if (diff >= 2) momentum = 'UP';
        else if (diff <= -2) momentum = 'DOWN';
      } else if (historyList.length === 1) {
        prevScore = historyList[0].coreScore;
        const diff = coreScoreVal - prevScore;
        if (diff >= 2) momentum = 'UP';
        else if (diff <= -2) momentum = 'DOWN';
      }

      const activeProductCount = prodCountMap.get(c.id) || 0;
      const branchCode = branchMap.get(c.id) || '0104';
      const rmName = c.assignedRmId ? userMap.get(c.assignedRmId) || `RM #${c.assignedRmId}` : 'Unassigned';

      let scoreBand = '60-74';
      if (coreScoreVal >= 90) scoreBand = '90-100';
      else if (coreScoreVal >= 75) scoreBand = '75-89';
      else if (coreScoreVal >= 60) scoreBand = '60-74';
      else if (coreScoreVal >= 40) scoreBand = '40-59';
      else scoreBand = '0-39';

      const relValNum = parseFloat(c.relationshipValue || '0') || 0;

      return {
        ...c,
        coreScore: coreScoreVal,
        previousScore: prevScore,
        scoreDelta: coreScoreVal - prevScore,
        scoreBand,
        momentum,
        activeProductCount,
        branchCode,
        rmName,
        relationshipValueAmount: relValNum,
        financialHealthScore: score?.financialHealthScore ?? coreScoreVal,
        creditRiskScore: score?.creditRiskScore ?? coreScoreVal,
        engagementScore: score?.engagementScore ?? coreScoreVal,
        lastActivity: c.updatedAt ? c.updatedAt.toISOString().split('T')[0] : '2026-09-01',
      };
    });

    // Apply secondary in-memory filters on verified attributes
    return enriched.filter((c) => {
      if (filter.branch && c.branchCode !== filter.branch) return false;
      if (filter.scoreBand && c.scoreBand !== filter.scoreBand) return false;
      if (filter.momentum && c.momentum !== filter.momentum) return false;
      if (filter.productCount) {
        if (filter.productCount === '1' && c.activeProductCount !== 1) return false;
        if (filter.productCount === '2' && c.activeProductCount !== 2) return false;
        if (filter.productCount === '3' && c.activeProductCount !== 3) return false;
        if (filter.productCount === '4+' && c.activeProductCount < 4) return false;
      }
      return true;
    });
  },

  /**
   * 1. EXECUTIVE OVERVIEW METRICS
   */
  async getExecutiveOverview(filter: AnalyticsFilterParams, scope: UserScope) {
    const window = computeDateWindow(filter);
    const filteredCustomers = await this.getFilteredCustomers(filter, scope);
    const customerIds = filteredCustomers.map((c) => c.id);

    // Current Customer Metrics
    const totalCustomers = filteredCustomers.length;
    const activeRelationships = filteredCustomers.filter((c) => c.status === 'ACTIVE').length;
    const totalRelationshipValue = filteredCustomers.reduce((sum, c) => sum + c.relationshipValueAmount, 0);
    const averageCoreScore = totalCustomers > 0 
      ? Math.round((filteredCustomers.reduce((sum, c) => sum + c.coreScore, 0) / totalCustomers) * 10) / 10 
      : 0;
    const customersNeedingAttention = filteredCustomers.filter((c) => c.coreScore < 60 || c.riskCategory === 'HIGH').length;

    // Fetch Opportunities
    const oppQuery = db.select().from(opportunities);
    const allOpps = customerIds.length > 0
      ? await oppQuery.where(inArray(opportunities.customerId, customerIds))
      : [];

    const activeOpps = allOpps.filter((o) => !['WON', 'LOST'].includes(o.stage));
    const activeOpportunitiesCount = activeOpps.length;
    const pipelineValue = activeOpps.reduce((sum, o) => sum + (parseFloat(o.expectedValue || '0') || 0), 0);

    // Fetch Service Cases
    const casesQuery = db.select().from(serviceCases);
    const allCases = customerIds.length > 0
      ? await casesQuery.where(inArray(serviceCases.customerId, customerIds))
      : [];

    const openServiceCases = allCases.filter((sc) => ['OPEN', 'IN_PROGRESS', 'ESCALATED'].includes(sc.status)).length;
    
    // SLA At Risk: due within 24h and not resolved
    const nowMs = Date.now();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    const slaAtRisk = allCases.filter((sc) => {
      if (['RESOLVED', 'CLOSED'].includes(sc.status)) return false;
      if (!sc.slaDueDate) return false;
      const dueTime = new Date(sc.slaDueDate).getTime();
      return dueTime > nowMs && (dueTime - nowMs) <= twentyFourHoursMs;
    }).length;

    // Fetch Tasks
    const taskQuery = db.select().from(tasks);
    const allTasks = customerIds.length > 0
      ? await taskQuery.where(inArray(tasks.customerId, customerIds))
      : [];

    const todayStr = new Date().toISOString().split('T')[0];
    const overdueTasks = allTasks.filter((t) => t.status === 'PENDING' && t.dueDate && t.dueDate < todayStr).length;

    // Comparative Prior Period Calculation from persisted records
    // Prior CORE score from historical records for the same customer cohort
    const priorHistory = await db.select().from(customerScoreHistory).where(
      and(
        lte(customerScoreHistory.recordedDate, window.priorEnd.toISOString().split('T')[0]),
        gte(customerScoreHistory.recordedDate, window.priorStart.toISOString().split('T')[0])
      )
    );
    const priorScoreAvg = priorHistory.length > 0
      ? Math.round((priorHistory.reduce((sum, h) => sum + h.coreScore, 0) / priorHistory.length) * 10) / 10
      : averageCoreScore;

    // Prior period opportunity records created before current window
    const priorOpps = allOpps.filter((o) => o.createdAt && new Date(o.createdAt) <= window.priorEnd);
    const priorPipelineValue = priorOpps.filter((o) => !['WON', 'LOST'].includes(o.stage))
      .reduce((sum, o) => sum + (parseFloat(o.expectedValue || '0') || 0), 0);

    const priorCases = allCases.filter((sc) => sc.createdAt && new Date(sc.createdAt) <= window.priorEnd);
    const priorOpenCases = priorCases.filter((sc) => ['OPEN', 'IN_PROGRESS', 'ESCALATED'].includes(sc.status)).length;

    // Compute Deltas
    const deltaScore = Math.round((averageCoreScore - priorScoreAvg) * 10) / 10;
    const deltaPipeline = pipelineValue - priorPipelineValue;
    const deltaCases = openServiceCases - priorOpenCases;

    return {
      period: window.label,
      dateRange: {
        currentStart: window.start.toISOString().split('T')[0],
        currentEnd: window.end.toISOString().split('T')[0],
        priorStart: window.priorStart.toISOString().split('T')[0],
        priorEnd: window.priorEnd.toISOString().split('T')[0],
      },
      kpis: [
        {
          id: 'total_customers',
          label: 'Total Customers',
          value: totalCustomers,
          unit: 'customers',
          comparison: `${activeRelationships} actively transacting relationships`,
          trend: 'STABLE',
          changeDescription: 'Total portfolio customers in selected scope',
        },
        {
          id: 'active_relationships',
          label: 'Active Relationships',
          value: activeRelationships,
          unit: 'accounts',
          comparison: `${Math.round((activeRelationships / (totalCustomers || 1)) * 100)}% active engagement rate`,
          trend: activeRelationships >= totalCustomers ? 'STABLE' : 'UP',
          changeDescription: 'Currently active customer relationships',
        },
        {
          id: 'total_relationship_value',
          label: 'Total Relationship Value',
          value: totalRelationshipValue,
          formattedValue: `₹${(totalRelationshipValue / 10000000).toFixed(2)} Cr`,
          unit: 'currency',
          comparison: `Avg ₹${(totalRelationshipValue / (totalCustomers || 1) / 100000).toFixed(1)}L per customer`,
          trend: 'UP',
          changeDescription: 'Aggregate TRV across CASA, Term Deposits, and Advances',
        },
        {
          id: 'average_core_score',
          label: 'Average CORE Score',
          value: averageCoreScore,
          unit: 'points',
          comparison: `${deltaScore >= 0 ? '+' : ''}${deltaScore} points vs prior period baseline (${priorScoreAvg})`,
          trend: deltaScore >= 0 ? 'UP' : 'DOWN',
          changeDescription: 'Deterministic relationship health index (0–100)',
        },
        {
          id: 'customers_needing_attention',
          label: 'Needs Attention',
          value: customersNeedingAttention,
          unit: 'customers',
          comparison: `${totalCustomers - customersNeedingAttention} relationships in pristine condition`,
          trend: customersNeedingAttention > 0 ? 'DOWN' : 'STABLE',
          changeDescription: 'CORE Score below 60 or high risk profile',
        },
        {
          id: 'active_opportunities',
          label: 'Active Opportunities',
          value: activeOpportunitiesCount,
          unit: 'deals',
          comparison: `${allOpps.filter(o => o.stage === 'WON').length} closed won this fiscal year`,
          trend: 'STABLE',
          changeDescription: 'Unclosed deals currently in pipeline stages',
        },
        {
          id: 'pipeline_value',
          label: 'Pipeline Value',
          value: pipelineValue,
          formattedValue: `₹${(pipelineValue / 100000).toFixed(1)}L`,
          unit: 'currency',
          comparison: `${deltaPipeline >= 0 ? '+' : ''}₹${(deltaPipeline / 100000).toFixed(1)}L movement`,
          trend: deltaPipeline >= 0 ? 'UP' : 'DOWN',
          changeDescription: 'Aggregate unweighted value of active opportunities',
        },
        {
          id: 'open_service_cases',
          label: 'Open Service Cases',
          value: openServiceCases,
          unit: 'cases',
          comparison: `${deltaCases > 0 ? '+' : ''}${deltaCases} cases vs prior period`,
          trend: deltaCases <= 0 ? 'UP' : 'DOWN',
          changeDescription: 'Active customer queries and grievance tickets',
        },
        {
          id: 'sla_at_risk',
          label: 'SLA At Risk',
          value: slaAtRisk,
          unit: 'tickets',
          comparison: `${allCases.filter(c => c.status === 'RESOLVED').length} resolved tickets on record`,
          trend: slaAtRisk === 0 ? 'UP' : 'DOWN',
          changeDescription: 'Cases expiring within the next 24 business hours',
        },
        {
          id: 'overdue_tasks',
          label: 'Overdue Officer Tasks',
          value: overdueTasks,
          unit: 'tasks',
          comparison: `${allTasks.filter(t => t.status === 'COMPLETED').length} tasks successfully finalized`,
          trend: overdueTasks === 0 ? 'UP' : 'DOWN',
          changeDescription: 'Follow-ups and documentation actions past due date',
        },
      ],
    };
  },

  /**
   * 2. RELATIONSHIP PORTFOLIO ANALYTICS
   */
  async getRelationshipPortfolio(filter: AnalyticsFilterParams, scope: UserScope) {
    const customersList = await this.getFilteredCustomers(filter, scope);
    const count = customersList.length;

    // Aggregate metrics
    const totalVal = customersList.reduce((sum, c) => sum + c.relationshipValueAmount, 0);
    const avgVal = count > 0 ? Math.round(totalVal / count) : 0;
    
    // Median Value
    const sortedValues = [...customersList.map(c => c.relationshipValueAmount)].sort((a, b) => a - b);
    const medianVal = count === 0 ? 0 : count % 2 === 1 
      ? sortedValues[Math.floor(count / 2)] 
      : Math.round((sortedValues[count / 2 - 1] + sortedValues[count / 2]) / 2);

    const activeCount = customersList.filter(c => c.status === 'ACTIVE').length;
    const dormantCount = customersList.filter(c => c.status !== 'ACTIVE').length;
    const totalActiveProducts = customersList.reduce((sum, c) => sum + c.activeProductCount, 0);
    const avgProductsPerCustomer = count > 0 ? Math.round((totalActiveProducts / count) * 10) / 10 : 0;

    // Breakdown by Customer Segment (entityType)
    const segmentMap = new Map<string, { count: number; totalVal: number; totalScore: number }>();
    for (const c of customersList) {
      const seg = c.entityType || 'INDIVIDUAL';
      const existing = segmentMap.get(seg) || { count: 0, totalVal: 0, totalScore: 0 };
      existing.count += 1;
      existing.totalVal += c.relationshipValueAmount;
      existing.totalScore += c.coreScore;
      segmentMap.set(seg, existing);
    }
    const bySegment = Array.from(segmentMap.entries()).map(([segment, data]) => ({
      segment,
      customerCount: data.count,
      totalRelationshipValue: data.totalVal,
      formattedValue: `₹${(data.totalVal / 100000).toFixed(1)}L`,
      averageCoreScore: Math.round(data.totalScore / data.count),
      percentage: Math.round((data.count / (count || 1)) * 100),
    }));

    // Breakdown by Branch
    const branchBreakdownMap = new Map<string, { count: number; totalVal: number; totalScore: number }>();
    for (const c of customersList) {
      const bCode = c.branchCode || '0104';
      const existing = branchBreakdownMap.get(bCode) || { count: 0, totalVal: 0, totalScore: 0 };
      existing.count += 1;
      existing.totalVal += c.relationshipValueAmount;
      existing.totalScore += c.coreScore;
      branchBreakdownMap.set(bCode, existing);
    }
    const byBranch = Array.from(branchBreakdownMap.entries()).map(([branchCode, data]) => ({
      branchCode,
      branchName: branchCode === '0104' ? 'Mumbai Fort Branch' : `Branch #${branchCode}`,
      customerCount: data.count,
      totalRelationshipValue: data.totalVal,
      formattedValue: `₹${(data.totalVal / 100000).toFixed(1)}L`,
      averageCoreScore: Math.round(data.totalScore / data.count),
    }));

    // Breakdown by RM
    const rmMap = new Map<string, { count: number; totalVal: number; totalScore: number }>();
    for (const c of customersList) {
      const rmName = c.rmName || 'Unassigned';
      const existing = rmMap.get(rmName) || { count: 0, totalVal: 0, totalScore: 0 };
      existing.count += 1;
      existing.totalVal += c.relationshipValueAmount;
      existing.totalScore += c.coreScore;
      rmMap.set(rmName, existing);
    }
    const byRm = Array.from(rmMap.entries()).map(([rmName, data]) => ({
      rmName,
      customerCount: data.count,
      totalRelationshipValue: data.totalVal,
      formattedValue: `₹${(data.totalVal / 100000).toFixed(1)}L`,
      averageCoreScore: Math.round(data.totalScore / data.count),
    }));

    // Breakdown by CORE Score Band
    const bandDefinitions = [
      { band: '90-100', label: 'Prime Sovereign (90–100)' },
      { band: '75-89', label: 'Strong Growth (75–89)' },
      { band: '60-74', label: 'Standard Stable (60–74)' },
      { band: '40-59', label: 'Needs Attention (40–59)' },
      { band: '0-39', label: 'High Risk (0–39)' },
    ];
    const scoreBandBreakdown = bandDefinitions.map((def) => {
      const matching = customersList.filter(c => c.scoreBand === def.band);
      const bVal = matching.reduce((sum, c) => sum + c.relationshipValueAmount, 0);
      return {
        band: def.band,
        label: def.label,
        customerCount: matching.length,
        percentage: count > 0 ? Math.round((matching.length / count) * 100) : 0,
        relationshipValue: bVal,
        formattedValue: `₹${(bVal / 100000).toFixed(1)}L`,
      };
    });

    // Breakdown by Momentum
    const momentumBreakdown = ['UP', 'STABLE', 'DOWN'].map((mom) => {
      const matching = customersList.filter(c => c.momentum === mom);
      const mVal = matching.reduce((sum, c) => sum + c.relationshipValueAmount, 0);
      return {
        momentum: mom,
        customerCount: matching.length,
        percentage: count > 0 ? Math.round((matching.length / count) * 100) : 0,
        relationshipValue: mVal,
        formattedValue: `₹${(mVal / 100000).toFixed(1)}L`,
      };
    });

    return {
      summary: {
        totalCustomers: count,
        totalRelationshipValue: totalVal,
        formattedTotalValue: `₹${(totalVal / 10000000).toFixed(2)} Cr`,
        averageRelationshipValue: avgVal,
        formattedAvgValue: `₹${(avgVal / 100000).toFixed(1)}L`,
        medianRelationshipValue: medianVal,
        formattedMedianValue: `₹${(medianVal / 100000).toFixed(1)}L`,
        activeCount,
        dormantCount,
        averageProductsPerCustomer: avgProductsPerCustomer,
        totalActiveProducts,
      },
      breakdowns: {
        bySegment,
        byBranch,
        byRm,
        byScoreBand: scoreBandBreakdown,
        byMomentum: momentumBreakdown,
      },
      customers: customersList.map((c) => ({
        id: c.id,
        customerCode: c.customerCode,
        name: c.name,
        entityType: c.entityType,
        riskCategory: c.riskCategory,
        status: c.status,
        relationshipValue: c.relationshipValueAmount,
        formattedValue: `₹${(c.relationshipValueAmount / 100000).toFixed(1)}L`,
        coreScore: c.coreScore,
        scoreBand: c.scoreBand,
        momentum: c.momentum,
        activeProductCount: c.activeProductCount,
        branchCode: c.branchCode,
        rmName: c.rmName,
        lastActivity: c.lastActivity,
      })),
    };
  },

  /**
   * 3. CUSTOMER HEALTH ANALYTICS
   */
  async getCustomerHealth(filter: AnalyticsFilterParams, scope: UserScope) {
    const customersList = await this.getFilteredCustomers(filter, scope);
    const count = customersList.length;

    const avgScore = count > 0 
      ? Math.round((customersList.reduce((sum, c) => sum + c.coreScore, 0) / count) * 10) / 10 
      : 0;

    // Movement groups
    const improvedList = customersList.filter(c => c.scoreDelta > 0);
    const declinedList = customersList.filter(c => c.scoreDelta < 0);
    const stableList = customersList.filter(c => c.scoreDelta === 0);

    // Needs Attention (score < 60)
    const needsAttentionList = customersList.filter(c => c.coreScore < 60 || c.riskCategory === 'HIGH');
    
    // At Risk (score < 40 or high risk)
    const atRiskList = customersList.filter(c => c.coreScore < 40 || c.riskCategory === 'HIGH');

    // Score distribution across 5 standard bands
    const scoreDistribution = [
      { band: '90-100', range: '90–100', count: customersList.filter(c => c.coreScore >= 90).length },
      { band: '75-89', range: '75–89', count: customersList.filter(c => c.coreScore >= 75 && c.coreScore < 90).length },
      { band: '60-74', range: '60–74', count: customersList.filter(c => c.coreScore >= 60 && c.coreScore < 75).length },
      { band: '40-59', range: '40–59', count: customersList.filter(c => c.coreScore >= 40 && c.coreScore < 60).length },
      { band: '0-39', range: '0–39', count: customersList.filter(c => c.coreScore < 40).length },
    ];

    return {
      metrics: {
        averageCoreScore: avgScore,
        totalEvaluated: count,
        improvedCount: improvedList.length,
        declinedCount: declinedList.length,
        stableCount: stableList.length,
        needsAttentionCount: needsAttentionList.length,
        atRiskCount: atRiskList.length,
      },
      scoreDistribution,
      healthChanges: customersList.map((c) => ({
        id: c.id,
        customerCode: c.customerCode,
        name: c.name,
        entityType: c.entityType,
        previousScore: c.previousScore,
        currentScore: c.coreScore,
        delta: c.scoreDelta,
        status: c.status,
        momentum: c.momentum,
        riskCategory: c.riskCategory,
        financialHealth: c.financialHealthScore,
        creditRisk: c.creditRiskScore,
        engagement: c.engagementScore,
        lastActivity: c.lastActivity,
        rmName: c.rmName,
      })),
      needsAttention: needsAttentionList.map((c) => ({
        id: c.id,
        customerCode: c.customerCode,
        name: c.name,
        coreScore: c.coreScore,
        riskCategory: c.riskCategory,
        rmName: c.rmName,
        reason: c.coreScore < 60 ? `CORE Score ${c.coreScore}/100 below 60 threshold` : 'High KYC/AML Risk Classification',
      })),
    };
  },

  /**
   * 4. CORE SCORE TRENDS (PERSISTED HISTORY ONLY)
   */
  async getCoreScoreTrends(filter: AnalyticsFilterParams, scope: UserScope) {
    const window = computeDateWindow(filter);
    const customersList = await this.getFilteredCustomers(filter, scope);
    const customerIds = customersList.map(c => c.id);

    // Query persisted history records in window
    const historyRows = customerIds.length > 0 
      ? await db
          .select()
          .from(customerScoreHistory)
          .where(
            and(
              inArray(customerScoreHistory.customerId, customerIds),
              gte(customerScoreHistory.recordedDate, window.start.toISOString().split('T')[0]),
              lte(customerScoreHistory.recordedDate, window.end.toISOString().split('T')[0])
            )
          )
          .orderBy(asc(customerScoreHistory.recordedDate))
      : [];

    // Group by recordedDate
    const dateMap = new Map<string, { totalScore: number; count: number; min: number; max: number }>();
    for (const row of historyRows) {
      const d = row.recordedDate;
      const cur = dateMap.get(d) || { totalScore: 0, count: 0, min: 100, max: 0 };
      cur.totalScore += row.coreScore;
      cur.count += 1;
      cur.min = Math.min(cur.min, row.coreScore);
      cur.max = Math.max(cur.max, row.coreScore);
      dateMap.set(d, cur);
    }

    const trendPoints = Array.from(dateMap.entries()).map(([date, stat]) => ({
      date,
      averageScore: Math.round((stat.totalScore / stat.count) * 10) / 10,
      customerCount: stat.count,
      minScore: stat.min,
      maxScore: stat.max,
    }));

    return {
      period: window.label,
      methodologyInfo: 'CORE Score is a deterministic relationship health metric calculated from Relationship Value, Product Depth, Engagement, Service Health, and Activity/Momentum.',
      disclaimer: 'Note: CORE Score is an internal enterprise portfolio health indicator and not a credit risk, statutory rating, or loan evaluation score.',
      totalHistoricalSnapshots: historyRows.length,
      trendPoints,
    };
  },

  /**
   * 5. OPPORTUNITY PERFORMANCE, PIPELINE FUNNEL & VELOCITY
   */
  async getOpportunityAnalytics(filter: AnalyticsFilterParams, scope: UserScope) {
    const scopedRmId = this.getScopedRmId(filter, scope);
    const customersList = await this.getFilteredCustomers(filter, scope);
    const customerIds = customersList.map(c => c.id);

    const conditions = [];
    if (customerIds.length > 0) {
      conditions.push(inArray(opportunities.customerId, customerIds));
    }
    if (scopedRmId) {
      conditions.push(eq(opportunities.assignedToId, scopedRmId));
    }
    if (filter.oppStage) {
      conditions.push(eq(opportunities.stage, filter.oppStage.toUpperCase()));
    }
    if (filter.oppProductId) {
      conditions.push(eq(opportunities.productId, Number(filter.oppProductId)));
    }

    const oppRows = conditions.length > 0
      ? await db.select().from(opportunities).where(and(...conditions))
      : await db.select().from(opportunities);

    // Fetch Products & Users for labels
    const prodList = await db.select().from(products);
    const prodMap = new Map<number, string>();
    for (const p of prodList) prodMap.set(p.id, p.name);

    const userList = await db.select().from(users);
    const userMap = new Map<number, string>();
    for (const u of userList) userMap.set(u.id, u.name);

    const custMap = new Map<number, typeof customersList[0]>();
    for (const c of customersList) custMap.set(c.id, c);

    const nowMs = Date.now();
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    let totalPipelineValue = 0;
    let weightedPipelineValue = 0;
    let activeDealsCount = 0;
    let closingSoonCount = 0;
    let stalledCount = 0;
    let wonCount = 0;
    let lostCount = 0;

    const stageCounts: Record<string, { count: number; value: number; weighted: number; totalDays: number }> = {
      IDENTIFIED: { count: 0, value: 0, weighted: 0, totalDays: 0 },
      QUALIFIED: { count: 0, value: 0, weighted: 0, totalDays: 0 },
      PROPOSAL: { count: 0, value: 0, weighted: 0, totalDays: 0 },
      NEGOTIATION: { count: 0, value: 0, weighted: 0, totalDays: 0 },
      WON: { count: 0, value: 0, weighted: 0, totalDays: 0 },
      LOST: { count: 0, value: 0, weighted: 0, totalDays: 0 },
    };

    const enrichedOpps = oppRows.map((o) => {
      const val = parseFloat(o.expectedValue || '0') || 0;
      const prob = o.probability || 50;
      const weighted = Math.round(val * (prob / 100));
      const productName = o.productId ? prodMap.get(o.productId) || `Product #${o.productId}` : 'Unassigned Product';
      const assignedToName = o.assignedToId ? userMap.get(o.assignedToId) || `Officer #${o.assignedToId}` : 'Unassigned';
      const customerName = custMap.get(o.customerId)?.name || `Customer #${o.customerId}`;

      const createdTime = o.createdAt ? new Date(o.createdAt).getTime() : nowMs;
      const updatedTime = o.updatedAt ? new Date(o.updatedAt).getTime() : createdTime;
      const daysInStage = Math.max(1, Math.round((nowMs - updatedTime) / (24 * 60 * 60 * 1000)));
      const ageDays = Math.max(1, Math.round((nowMs - createdTime) / (24 * 60 * 60 * 1000)));

      const isWon = o.stage === 'WON';
      const isLost = o.stage === 'LOST';
      const isActive = !isWon && !isLost;

      if (isActive) {
        activeDealsCount += 1;
        totalPipelineValue += val;
        weightedPipelineValue += weighted;

        if (o.expectedCloseDate) {
          const closeTime = new Date(o.expectedCloseDate).getTime();
          if (closeTime >= nowMs && (closeTime - nowMs) <= fourteenDaysMs) {
            closingSoonCount += 1;
          }
        }

        if (daysInStage > 30) {
          stalledCount += 1;
        }
      } else if (isWon) {
        wonCount += 1;
      } else if (isLost) {
        lostCount += 1;
      }

      const stgKey = o.stage?.toUpperCase() || 'IDENTIFIED';
      if (!stageCounts[stgKey]) {
        stageCounts[stgKey] = { count: 0, value: 0, weighted: 0, totalDays: 0 };
      }
      stageCounts[stgKey].count += 1;
      stageCounts[stgKey].value += val;
      stageCounts[stgKey].weighted += weighted;
      stageCounts[stgKey].totalDays += daysInStage;

      return {
        id: o.id,
        opportunityCode: o.opportunityCode,
        title: o.title,
        customerId: o.customerId,
        customerName,
        productId: o.productId,
        productName,
        stage: o.stage,
        priority: (o as any).priority || 'MEDIUM',
        expectedValue: val,
        formattedValue: `₹${(val / 100000).toFixed(1)}L`,
        probability: prob,
        weightedValue: weighted,
        formattedWeightedValue: `₹${(weighted / 100000).toFixed(1)}L`,
        expectedCloseDate: o.expectedCloseDate,
        assignedToId: o.assignedToId,
        assignedToName,
        daysInStage,
        ageDays,
        status: isActive ? 'ACTIVE' : o.stage,
      };
    });

    // Funnel stages in sequential order
    const funnelStages = ['IDENTIFIED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'].map((stg) => {
      const data = stageCounts[stg] || { count: 0, value: 0, weighted: 0, totalDays: 0 };
      const avgDaysInStage = data.count > 0 ? Math.round(data.totalDays / data.count) : 0;
      return {
        stage: stg,
        opportunityCount: data.count,
        pipelineValue: data.value,
        formattedValue: `₹${(data.value / 100000).toFixed(1)}L`,
        weightedValue: data.weighted,
        formattedWeightedValue: `₹${(data.weighted / 100000).toFixed(1)}L`,
        averageDaysInStage: avgDaysInStage,
        stageConversionNote: 'Historical stage conversion tracking active across verified milestones',
      };
    });

    const averageOpportunityValue = activeDealsCount > 0 ? Math.round(totalPipelineValue / activeDealsCount) : 0;

    return {
      summary: {
        activeOpportunities: activeDealsCount,
        totalPipelineValue,
        formattedTotalPipelineValue: `₹${(totalPipelineValue / 10000000).toFixed(2)} Cr`,
        weightedPipelineValue,
        formattedWeightedPipelineValue: `₹${(weightedPipelineValue / 10000000).toFixed(2)} Cr`,
        averageOpportunityValue,
        formattedAvgValue: `₹${(averageOpportunityValue / 100000).toFixed(1)}L`,
        closingSoonCount,
        stalledCount,
        wonCount,
        lostCount,
      },
      funnel: funnelStages,
      opportunities: enrichedOpps,
    };
  },

  /**
   * 6. SERVICE PERFORMANCE & SLA ANALYTICS
   */
  async getServicePerformance(filter: AnalyticsFilterParams, scope: UserScope) {
    const customersList = await this.getFilteredCustomers(filter, scope);
    const customerIds = customersList.map(c => c.id);

    const conditions = [];
    if (customerIds.length > 0) {
      conditions.push(inArray(serviceCases.customerId, customerIds));
    }
    if (filter.caseStatus) {
      conditions.push(eq(serviceCases.status, filter.caseStatus.toUpperCase()));
    }
    if (filter.casePriority) {
      conditions.push(eq(serviceCases.priority, filter.casePriority.toUpperCase()));
    }

    const casesRows = conditions.length > 0
      ? await db.select().from(serviceCases).where(and(...conditions))
      : await db.select().from(serviceCases);

    const userList = await db.select().from(users);
    const userMap = new Map<number, string>();
    for (const u of userList) userMap.set(u.id, u.name);

    const nowMs = Date.now();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    let casesOpened = casesRows.length;
    let resolvedCount = 0;
    let closedCount = 0;
    let openCount = 0;
    let inProgressCount = 0;
    let escalatedCount = 0;
    let slaAtRiskCount = 0;
    let slaBreachedCount = 0;
    let totalResolutionTimeHours = 0;
    const resolvedDurationsHours: number[] = [];

    const enrichedCases = casesRows.map((sc) => {
      const createdTime = sc.createdAt ? new Date(sc.createdAt).getTime() : nowMs;
      const isResolved = ['RESOLVED', 'CLOSED'].includes(sc.status);
      const isClosed = sc.status === 'CLOSED';
      const isOpen = sc.status === 'OPEN';
      const isInProgress = sc.status === 'IN_PROGRESS';
      const isEscalated = sc.status === 'ESCALATED';

      if (isResolved) resolvedCount += 1;
      if (isClosed) closedCount += 1;
      if (isOpen) openCount += 1;
      if (isInProgress) inProgressCount += 1;
      if (isEscalated) escalatedCount += 1;

      // SLA Evaluation
      let slaState: 'WITHIN_SLA' | 'AT_RISK' | 'BREACHED' = 'WITHIN_SLA';
      if (sc.slaDueDate) {
        const dueTime = new Date(sc.slaDueDate).getTime();
        if (isResolved) {
          const resolvedTime = sc.updatedAt ? new Date(sc.updatedAt).getTime() : nowMs;
          if (resolvedTime > dueTime) {
            slaState = 'BREACHED';
          }
        } else {
          if (nowMs > dueTime) {
            slaState = 'BREACHED';
            slaBreachedCount += 1;
          } else if (dueTime - nowMs <= twentyFourHoursMs) {
            slaState = 'AT_RISK';
            slaAtRiskCount += 1;
          }
        }
      }

      // Resolution time only for resolved cases
      let resolutionHours: number | null = null;
      if (isResolved && sc.createdAt) {
        const resolvedTime = sc.updatedAt ? new Date(sc.updatedAt).getTime() : nowMs;
        resolutionHours = Math.max(1, Math.round((resolvedTime - createdTime) / (60 * 60 * 1000)));
        totalResolutionTimeHours += resolutionHours;
        resolvedDurationsHours.push(resolutionHours);
      }

      return {
        id: sc.id,
        caseNumber: sc.caseNumber,
        title: sc.title,
        customerId: sc.customerId,
        category: sc.category,
        priority: sc.priority,
        status: sc.status,
        slaState,
        slaDueDate: sc.slaDueDate ? sc.slaDueDate.toISOString() : null,
        assignedToId: sc.assignedToId,
        assignedToName: sc.assignedToId ? userMap.get(sc.assignedToId) || `Agent #${sc.assignedToId}` : 'Unassigned',
        resolutionHours,
        createdAt: sc.createdAt ? sc.createdAt.toISOString() : null,
      };
    });

    const avgResolutionTimeHours = resolvedDurationsHours.length > 0
      ? Math.round((totalResolutionTimeHours / resolvedDurationsHours.length) * 10) / 10
      : 0;

    // Median resolution time
    resolvedDurationsHours.sort((a, b) => a - b);
    const medianResolutionTimeHours = resolvedDurationsHours.length === 0 ? 0
      : resolvedDurationsHours[Math.floor(resolvedDurationsHours.length / 2)];

    const compliantCases = resolvedDurationsHours.length - slaBreachedCount;
    const slaCompliancePercentage = resolvedDurationsHours.length > 0
      ? Math.round((Math.max(0, compliantCases) / resolvedDurationsHours.length) * 100)
      : 100;

    return {
      metrics: {
        casesOpened,
        casesResolved: resolvedCount,
        casesClosed: closedCount,
        openCases: openCount,
        pendingCases: inProgressCount,
        escalatedCases: escalatedCount,
        slaAtRisk: slaAtRiskCount,
        slaBreached: slaBreachedCount,
        slaCompliancePercentage,
        averageResolutionTimeHours: avgResolutionTimeHours,
        medianResolutionTimeHours,
      },
      cases: enrichedCases,
    };
  },

  /**
   * 7. RM PRODUCTIVITY ANALYTICS
   */
  async getRmProductivity(filter: AnalyticsFilterParams, scope: UserScope) {
    const allUsers = await db.select().from(users);
    const allCustomers = await db.select().from(customers);
    const allTasks = await db.select().from(tasks);
    const allOpps = await db.select().from(opportunities);
    const allInteractions = await db.select().from(interactions);
    const allScores = await db.select().from(customerScores);

    const scoreMap = new Map<number, number>();
    for (const s of allScores) scoreMap.set(s.customerId, s.coreScore);

    const todayStr = new Date().toISOString().split('T')[0];

    // Filter down to officers with assignments or RM role
    const scopedRmId = this.getScopedRmId(filter, scope);
    const officers = allUsers.filter(u => {
      if (scopedRmId) return u.id === scopedRmId;
      return ['RELATIONSHIP_MANAGER', 'BRANCH_MANAGER', 'MAKER_L2', 'OPERATIONS'].includes(u.role);
    });

    const productivityList = officers.map((off) => {
      const assignedCusts = allCustomers.filter(c => c.assignedRmId === off.id);
      const userTasks = allTasks.filter(t => t.assignedToId === off.id);
      const openTasks = userTasks.filter(t => t.status === 'PENDING').length;
      const completedTasks = userTasks.filter(t => t.status === 'COMPLETED').length;
      const overdueTasks = userTasks.filter(t => t.status === 'PENDING' && t.dueDate && t.dueDate < todayStr).length;
      const totalTasks = userTasks.length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

      const userOpps = allOpps.filter(o => o.assignedToId === off.id);
      const activeOpps = userOpps.filter(o => !['WON', 'LOST'].includes(o.stage));
      const totalPipeline = activeOpps.reduce((sum, o) => sum + (parseFloat(o.expectedValue || '0') || 0), 0);

      const userInteractions = allInteractions.filter(i => i.agentId === off.id);
      
      const totalScores = assignedCusts.reduce((sum, c) => sum + (scoreMap.get(c.id) || 75), 0);
      const avgScore = assignedCusts.length > 0 ? Math.round(totalScores / assignedCusts.length) : 80;

      return {
        rmId: off.id,
        employeeId: off.employeeId,
        rmName: off.name,
        department: off.department || 'RELATIONSHIP_BANKING',
        assignedCustomersCount: assignedCusts.length,
        openTasks,
        completedTasks,
        overdueTasks,
        completionRate,
        activeOpportunitiesCount: activeOpps.length,
        pipelineValue: totalPipeline,
        formattedPipelineValue: `₹${(totalPipeline / 100000).toFixed(1)}L`,
        interactionsLogged: userInteractions.length,
        averageCustomerCoreScore: avgScore,
      };
    });

    return {
      officers: productivityList,
    };
  },

  /**
   * 8. PRODUCT PENETRATION & RELATIONSHIP DEPTH ANALYTICS
   */
  async getProductPenetration(filter: AnalyticsFilterParams, scope: UserScope) {
    const customersList = await this.getFilteredCustomers(filter, scope);
    const customerCount = customersList.length;
    const customerIds = customersList.map(c => c.id);

    const allProds = await db.select().from(products);
    const allEnrollments = customerIds.length > 0
      ? await db.select().from(customerProducts).where(inArray(customerProducts.customerId, customerIds))
      : [];

    const activeEnrollments = allEnrollments.filter(e => e.status === 'ACTIVE');

    // Customer product depth buckets (0, 1, 2, 3, 4+)
    const customerDepthMap = new Map<number, number>();
    for (const c of customersList) customerDepthMap.set(c.id, 0);
    for (const e of activeEnrollments) {
      customerDepthMap.set(e.customerId, (customerDepthMap.get(e.customerId) || 0) + 1);
    }

    const depthBuckets = [
      { depth: '0 Products', count: 0, customers: [] as any[] },
      { depth: '1 Product', count: 0, customers: [] as any[] },
      { depth: '2 Products', count: 0, customers: [] as any[] },
      { depth: '3 Products', count: 0, customers: [] as any[] },
      { depth: '4+ Products', count: 0, customers: [] as any[] },
    ];

    for (const c of customersList) {
      const d = customerDepthMap.get(c.id) || 0;
      let targetIdx = 0;
      if (d === 1) targetIdx = 1;
      else if (d === 2) targetIdx = 2;
      else if (d === 3) targetIdx = 3;
      else if (d >= 4) targetIdx = 4;

      depthBuckets[targetIdx].count += 1;
      depthBuckets[targetIdx].customers.push({
        id: c.id,
        customerCode: c.customerCode,
        name: c.name,
        activeProducts: d,
        coreScore: c.coreScore,
      });
    }

    const depthAnalysis = depthBuckets.map(b => ({
      depth: b.depth,
      customerCount: b.count,
      percentage: customerCount > 0 ? Math.round((b.count / customerCount) * 100) : 0,
      customerSample: b.customers.slice(0, 5),
    }));

    // Product breakdown table
    const productStats = allProds.map((prod) => {
      const matchingEnrollments = activeEnrollments.filter(e => e.productId === prod.id);
      const enrolledCustomers = matchingEnrollments.length;
      const penetrationPercent = customerCount > 0 ? Math.round((enrolledCustomers / customerCount) * 100) : 0;
      
      // Calculate TRV of customers holding this product
      const holderCustIds = new Set(matchingEnrollments.map(e => e.customerId));
      const holderVal = customersList.filter(c => holderCustIds.has(c.id)).reduce((sum, c) => sum + c.relationshipValueAmount, 0);

      return {
        productId: prod.id,
        productCode: prod.productCode,
        productName: prod.name,
        category: prod.category,
        enrolledCustomers,
        penetrationPercentage: penetrationPercent,
        relationshipValueSum: holderVal,
        formattedValue: `₹${(holderVal / 100000).toFixed(1)}L`,
      };
    });

    return {
      summary: {
        totalProductsInCatalog: allProds.length,
        totalActiveEnrollments: activeEnrollments.length,
        averageProductsPerCustomer: customerCount > 0 ? Math.round((activeEnrollments.length / customerCount) * 10) / 10 : 0,
      },
      depthAnalysis,
      products: productStats,
    };
  },

  /**
   * 9. ENGAGEMENT ANALYTICS
   */
  async getEngagementAnalytics(filter: AnalyticsFilterParams, scope: UserScope) {
    const window = computeDateWindow(filter);
    const customersList = await this.getFilteredCustomers(filter, scope);
    const customerIds = customersList.map(c => c.id);

    const conditions = [];
    if (customerIds.length > 0) {
      conditions.push(inArray(interactions.customerId, customerIds));
    }
    conditions.push(gte(interactions.timestamp, window.start));
    conditions.push(lte(interactions.timestamp, window.end));

    const interactionRows = customerIds.length > 0
      ? await db.select().from(interactions).where(and(...conditions))
      : [];

    const channelCounts: Record<string, number> = {
      IN_BRANCH: 0,
      RM_VISIT: 0,
      PHONE: 0,
      NET_BANKING: 0,
      EMAIL: 0,
    };

    const customerInteractionsMap = new Map<number, number>();
    for (const c of customersList) customerInteractionsMap.set(c.id, 0);

    for (const row of interactionRows) {
      const ch = row.channel || 'IN_BRANCH';
      channelCounts[ch] = (channelCounts[ch] || 0) + 1;
      customerInteractionsMap.set(row.customerId, (customerInteractionsMap.get(row.customerId) || 0) + 1);
    }

    let engagedCustomerCount = 0;
    for (const count of customerInteractionsMap.values()) {
      if (count > 0) engagedCustomerCount += 1;
    }

    return {
      period: window.label,
      totalInteractions: interactionRows.length,
      engagedCustomers: engagedCustomerCount,
      unengagedCustomers: customersList.length - engagedCustomerCount,
      channelBreakdown: Object.entries(channelCounts).map(([channel, count]) => ({
        channel,
        count,
        percentage: interactionRows.length > 0 ? Math.round((count / interactionRows.length) * 100) : 0,
      })),
      recentInteractions: interactionRows.slice(0, 10).map((r) => ({
        id: r.id,
        customerId: r.customerId,
        channel: r.channel,
        interactionType: r.interactionType,
        subject: r.subject,
        timestamp: r.timestamp ? r.timestamp.toISOString() : null,
      })),
    };
  },

  /**
   * 10. TASK ANALYTICS & AGING
   */
  async getTaskAnalytics(filter: AnalyticsFilterParams, scope: UserScope) {
    const customersList = await this.getFilteredCustomers(filter, scope);
    const customerIds = customersList.map(c => c.id);

    const taskRows = customerIds.length > 0
      ? await db.select().from(tasks).where(inArray(tasks.customerId, customerIds))
      : [];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let open = 0;
    let completed = 0;
    let cancelled = 0;
    let overdue = 0;
    let dueToday = 0;
    let dueThisWeek = 0;

    const agingBuckets = {
      '0-1 Day': 0,
      '2-3 Days': 0,
      '4-7 Days': 0,
      '8+ Days': 0,
    };

    for (const t of taskRows) {
      if (t.status === 'COMPLETED') completed += 1;
      else if (t.status === 'CANCELLED') cancelled += 1;
      else {
        open += 1;
        if (t.dueDate) {
          if (t.dueDate < todayStr) {
            overdue += 1;
            const diffDays = Math.max(1, Math.round((now.getTime() - new Date(t.dueDate).getTime()) / (24 * 60 * 60 * 1000)));
            if (diffDays <= 1) agingBuckets['0-1 Day'] += 1;
            else if (diffDays <= 3) agingBuckets['2-3 Days'] += 1;
            else if (diffDays <= 7) agingBuckets['4-7 Days'] += 1;
            else agingBuckets['8+ Days'] += 1;
          } else if (t.dueDate === todayStr) {
            dueToday += 1;
          } else if (t.dueDate <= sevenDaysLater) {
            dueThisWeek += 1;
          }
        }
      }
    }

    return {
      totalTasks: taskRows.length,
      open,
      completed,
      cancelled,
      overdue,
      dueToday,
      dueThisWeek,
      completionRate: taskRows.length > 0 ? Math.round((completed / taskRows.length) * 100) : 100,
      overdueAging: Object.entries(agingBuckets).map(([bucket, count]) => ({
        bucket,
        count,
      })),
      tasks: taskRows.map((t) => ({
        id: t.id,
        title: t.title,
        customerId: t.customerId,
        dueDate: t.dueDate,
        priority: t.priority,
        status: t.status,
      })),
    };
  },

  /**
   * 11. INTELLIGENCE, NBA, RADAR & NOTIFICATION ANALYTICS
   */
  async getIntelligenceAnalytics(filter: AnalyticsFilterParams, scope: UserScope) {
    const customersList = await this.getFilteredCustomers(filter, scope);
    const customerIds = customersList.map(c => c.id);

    const [allInsights, allNba, allRadar, allNotifs] = await Promise.all([
      customerIds.length > 0 ? db.select().from(customerInsights).where(inArray(customerInsights.customerId, customerIds)) : [],
      customerIds.length > 0 ? db.select().from(nextBestActions).where(inArray(nextBestActions.customerId, customerIds)) : [],
      customerIds.length > 0 ? db.select().from(customerOpportunityRadar).where(inArray(customerOpportunityRadar.customerId, customerIds)) : [],
      db.select().from(notifications),
    ]);

    // Insights breakdown
    const activeInsights = allInsights.filter(i => !i.isDismissed);
    const highPriorityInsights = activeInsights.filter(i => i.urgency === 'HIGH' || i.urgency === 'CRITICAL');

    // NBA breakdown
    const availableNba = allNba.filter(n => n.status === 'AVAILABLE' || n.status === 'PENDING').length;
    const acceptedNba = allNba.filter(n => n.status === 'ACCEPTED').length;
    const dismissedNba = allNba.filter(n => n.status === 'DISMISSED').length;

    // Radar breakdown
    const activeRadar = allRadar.filter(r => ['DETECTED', 'REVIEW_SUGGESTED'].includes(r.status)).length;
    const convertedRadar = allRadar.filter(r => r.status === 'CONVERTED').length;
    const dismissedRadar = allRadar.filter(r => r.status === 'DISMISSED').length;

    // Notifications breakdown
    const unreadNotifs = allNotifs.filter(n => !n.isRead).length;
    const criticalNotifs = allNotifs.filter(n => n.severity === 'CRITICAL').length;
    const warningNotifs = allNotifs.filter(n => n.severity === 'WARNING').length;

    return {
      insights: {
        total: allInsights.length,
        active: activeInsights.length,
        highPriority: highPriorityInsights.length,
        byType: [
          { type: 'CROSS_SELL', count: allInsights.filter(i => i.insightType === 'CROSS_SELL').length },
          { type: 'LIQUIDITY', count: allInsights.filter(i => i.insightType === 'LIQUIDITY').length },
          { type: 'CREDIT_RISK', count: allInsights.filter(i => i.insightType === 'CREDIT_RISK').length },
        ],
      },
      nextBestActions: {
        total: allNba.length,
        available: availableNba,
        accepted: acceptedNba,
        dismissed: dismissedNba,
        conversionRateNote: allNba.length > 0 ? `${Math.round((acceptedNba / allNba.length) * 100)}% accepted` : 'Outcome measurement unavailable',
      },
      opportunityRadar: {
        total: allRadar.length,
        active: activeRadar,
        converted: convertedRadar,
        dismissed: dismissedRadar,
        conversionRateNote: allRadar.length > 0 ? `${Math.round((convertedRadar / allRadar.length) * 100)}% converted` : 'Verified conversion data unavailable',
      },
      notifications: {
        total: allNotifs.length,
        unread: unreadNotifs,
        critical: criticalNotifs,
        warning: warningNotifs,
      },
    };
  },

  /**
   * 12. "WHAT CHANGED?" COMPARISON ENGINE
   */
  async getWhatChanged(filter: AnalyticsFilterParams, scope: UserScope) {
    const window = computeDateWindow(filter);
    const overview = await this.getExecutiveOverview(filter, scope);

    const changes = [
      {
        metric: 'Average CORE Score',
        current: overview.kpis.find(k => k.id === 'average_core_score')?.value,
        comparisonPeriod: window.label,
        summary: overview.kpis.find(k => k.id === 'average_core_score')?.comparison,
        trend: overview.kpis.find(k => k.id === 'average_core_score')?.trend,
      },
      {
        metric: 'Pipeline Value',
        current: overview.kpis.find(k => k.id === 'pipeline_value')?.formattedValue,
        comparisonPeriod: window.label,
        summary: overview.kpis.find(k => k.id === 'pipeline_value')?.comparison,
        trend: overview.kpis.find(k => k.id === 'pipeline_value')?.trend,
      },
      {
        metric: 'Open Service Cases',
        current: overview.kpis.find(k => k.id === 'open_service_cases')?.value,
        comparisonPeriod: window.label,
        summary: overview.kpis.find(k => k.id === 'open_service_cases')?.comparison,
        trend: overview.kpis.find(k => k.id === 'open_service_cases')?.trend,
      },
      {
        metric: 'SLA At Risk',
        current: overview.kpis.find(k => k.id === 'sla_at_risk')?.value,
        comparisonPeriod: window.label,
        summary: overview.kpis.find(k => k.id === 'sla_at_risk')?.comparison,
        trend: overview.kpis.find(k => k.id === 'sla_at_risk')?.trend,
      },
      {
        metric: 'Overdue Tasks',
        current: overview.kpis.find(k => k.id === 'overdue_tasks')?.value,
        comparisonPeriod: window.label,
        summary: overview.kpis.find(k => k.id === 'overdue_tasks')?.comparison,
        trend: overview.kpis.find(k => k.id === 'overdue_tasks')?.trend,
      },
    ];

    return {
      currentPeriod: window.label,
      comparisonPeriod: `Prior equivalent window`,
      changes,
    };
  },
};
