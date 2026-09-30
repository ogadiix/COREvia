/**
 * COREvia Phase 32: Relationship Value & Portfolio Scenario Intelligence Service
 * Consumes Phase 30 Strategy Simulator and existing intelligence engines to evaluate
 * how strategic actions transform the multidimensional relationship profile.
 * Zero duplicate simulations. Zero predictive banking fabrications. Deterministic & Explainable.
 */

import { db } from '../db/index.ts';
import { customers, accounts, loans, customerProducts, opportunities, tasks, interactions } from '../db/schema.ts';
import { eq, desc, and } from 'drizzle-orm';
import { resourceAuth } from '../lib/resourceAuth.ts';
import { auditRepository } from '../repositories/audit.repository.ts';
import { strategySimulatorService } from './strategySimulator.service.ts';
import { decisionTraceService } from './decisionTrace.service.ts';
import { relationshipValueRepository } from '../repositories/relationshipValue.repository.ts';
import { SafeUser } from './auth.service.ts';
import { BankingError } from '../lib/errors.ts';
import {
  RelationshipValueSnapshotDTO,
  RelationshipDimensionItem,
  RelationshipValueProfileDTO,
  RelationshipValueBreakdownItem,
  SupportingSignalItem,
  RelationshipValueHistoryDTO,
  PortfolioRelationshipValueAnalyticsDTO,
  DimensionChangeType,
} from '../types/relationshipValue.types.ts';
import { RelationshipStateSnapshot } from '../types/strategySimulator.types.ts';

export class RelationshipValueService {
  /**
   * Translates a Phase 30 RelationshipStateSnapshot into a Phase 32 RelationshipValueSnapshotDTO
   */
  private snapshotFromState(
    state: RelationshipStateSnapshot,
    customerName: string,
    customerCode: string,
    scenarioId?: string | null,
    decisionTraceId?: string | null
  ): RelationshipValueSnapshotDTO {
    // Opportunity coverage calculation (mathematically derived from active pipeline)
    const totalOpps = (state.openOpportunitiesCount || 0) + (state.stalledOpportunitiesCount || 0);
    const oppCoverage = totalOpps > 0
      ? Math.round(((state.openOpportunitiesCount - state.stalledOpportunitiesCount) / totalOpps) * 50 + 50)
      : 60;

    // Commitment health (tasks & commitments execution ratio)
    const totalTasks = state.openTasksCount || 0;
    const overdue = state.overdueTasksCount || 0;
    const commitHealth = totalTasks > 0
      ? Math.max(20, Math.min(100, Math.round(((totalTasks - overdue) / totalTasks) * 100)))
      : 80;

    // Activity health (recency of interaction)
    const daysSince = state.daysSinceLastInteraction || 15;
    const activityHealth = Math.max(20, Math.min(100, Math.round(100 - daysSince * 2.5)));

    const relVal = state.relationshipValue || 0;

    return {
      customerId: state.customerId,
      customerCode: customerCode || state.customerCode,
      customerName: customerName || state.customerName,
      capturedAt: new Date().toISOString(),
      snapshotDate: new Date().toISOString().split('T')[0],
      relationshipValue: relVal,
      relationshipValueFormatted: `₹${(relVal / 100000).toFixed(1)}L`,
      coreScore: state.coreScore,
      productDepth: state.productDepth,
      engagement: state.engagementScore,
      serviceHealth: state.serviceHealth,
      relationshipMomentum: state.relationshipMomentum,
      opportunityCoverage: Math.max(0, Math.min(100, oppCoverage)),
      commitmentHealth: Math.max(0, Math.min(100, commitHealth)),
      activityHealth: Math.max(0, Math.min(100, activityHealth)),
      relationshipState: state.relationshipState,
      sourceVersion: 'Phase32-v1',
      sourceMetadata: {
        coreScoreSource: 'CORE Score Engine (Phase 10)',
        serviceHealthSource: 'Service Desk SLA Engine (Phase 5)',
        momentumSource: 'Relationship Intelligence Engine (Phase 12)',
        engagementSource: 'Engagement Telemetry Engine (Phase 26)',
        productDepthSource: 'Core Product Catalog Ledger (Phase 4)',
      },
      dataAsOf: state.asOf || new Date().toISOString(),
      scenarioId: scenarioId ?? null,
      decisionTraceId: decisionTraceId ?? null,
    };
  }

  /**
   * Generates factual breakdown items for why the relationship is valuable
   */
  private async buildValueBreakdown(customerId: number, baseSnapshot: RelationshipStateSnapshot): Promise<RelationshipValueBreakdownItem[]> {
    const [accCount, loanCount, prodCount, oppList] = await Promise.all([
      db.select({ count: accounts.id }).from(accounts).where(eq(accounts.customerId, customerId)),
      db.select({ count: loans.id }).from(loans).where(eq(loans.customerId, customerId)),
      db.select({ count: customerProducts.id }).from(customerProducts).where(eq(customerProducts.customerId, customerId)),
      db.select().from(opportunities).where(eq(opportunities.customerId, customerId)),
    ]);

    const items: RelationshipValueBreakdownItem[] = [];

    // 1. Total Relationship Value
    items.push({
      category: 'Relationship Value',
      description: 'Total measurable banking balance & asset book value across all accounts and facilities.',
      value: `₹${(baseSnapshot.relationshipValue / 100000).toFixed(1)} Lakhs`,
      source: 'Customer Master Record',
      impactLevel: baseSnapshot.relationshipValue > 5000000 ? 'HIGH' : 'MEDIUM',
    });

    // 2. Deposit & Liquidity Base
    if (baseSnapshot.totalDeposits > 0) {
      items.push({
        category: 'Operating Deposits',
        description: 'Aggregate liquid liability balance maintained across operative and fixed deposit accounts.',
        value: `₹${(baseSnapshot.totalDeposits / 100000).toFixed(1)} Lakhs (${accCount.length} accounts)`,
        source: 'Core Banking Ledger',
        impactLevel: 'HIGH',
      });
    }

    // 3. Lending & Credit Facilities
    if (baseSnapshot.totalLoans > 0) {
      items.push({
        category: 'Credit & Asset Exposure',
        description: 'Fund-based lending limits and outstanding loan principal balances.',
        value: `₹${(baseSnapshot.totalLoans / 100000).toFixed(1)} Lakhs (${loanCount.length} facility)`,
        source: 'Lending Operations Subsystem',
        impactLevel: 'HIGH',
      });
    }

    // 4. Product Depth
    items.push({
      category: 'Product Depth',
      description: 'Active banking services including Current Account, Term Loan, Corporate Net Banking, and Forex.',
      value: `${baseSnapshot.productDepth} Active Products`,
      source: 'Product Inventory Service',
      impactLevel: baseSnapshot.productDepth >= 4 ? 'HIGH' : 'MEDIUM',
    });

    // 5. Commercial Pipeline
    if (oppList.length > 0) {
      const pipelineVal = oppList.reduce((acc, o) => acc + parseFloat(String(o.expectedValue || 0)), 0);
      items.push({
        category: 'Strategic Opportunity Pipeline',
        description: 'Unrealized commercial opportunities under negotiation or closing.',
        value: `₹${(pipelineVal / 100000).toFixed(1)} Lakhs (${oppList.length} deals)`,
        source: 'Opportunity Management Subsystem',
        impactLevel: 'MEDIUM',
      });
    }

    return items;
  }

  /**
   * Compares two snapshots across the 10 standardized relationship dimensions
   */
  private compareSnapshots(
    current: RelationshipValueSnapshotDTO,
    scenario: RelationshipValueSnapshotDTO | null
  ): RelationshipDimensionItem[] {
    const isSimulated = !!scenario;

    const dimensions: Array<
      Omit<
        RelationshipDimensionItem,
        'status' | 'currentValueFormatted' | 'simulatedValueFormatted' | 'simulatedValue'
      >
    > = [
      // 1. RELATIONSHIP_VALUE (Strict rule: Do NOT invent monetary value)
      {
        dimension: 'RELATIONSHIP_VALUE',
        label: 'Relationship Value',
        currentValue: current.relationshipValueFormatted,
        scenarioValue: isSimulated ? current.relationshipValueFormatted : current.relationshipValueFormatted,
        change: isSimulated ? 'Not Recalculated' : 'Current',
        changeType: 'NOT_CALCULATED',
        sourceEngine: 'Customer Master / Core Banking',
        explanation: isSimulated
          ? 'Current simulation rules do not model monetary portfolio valuation. Existing customer valuation maintained.'
          : 'Total measurable relationship assets and balances.',
        notCalculatedReason: 'Current simulation rules do not model monetary relationship value.',
      },

      // 2. CORE_SCORE
      {
        dimension: 'CORE_SCORE',
        label: 'CORE Score',
        currentValue: current.coreScore,
        scenarioValue: isSimulated ? scenario!.coreScore : current.coreScore,
        change: isSimulated ? (scenario!.coreScore >= current.coreScore ? `+${scenario!.coreScore - current.coreScore}` : `${scenario!.coreScore - current.coreScore}`) : 0,
        changeType: !isSimulated ? 'UNCHANGED' : (scenario!.coreScore > current.coreScore ? 'IMPROVED' : (scenario!.coreScore < current.coreScore ? 'DECLINED' : 'UNCHANGED')),
        sourceEngine: 'CORE Score Engine',
        explanation: isSimulated
          ? `Projected CORE Score evolves from ${current.coreScore} to ${scenario!.coreScore} based on strategic actions.`
          : 'Multidimensional relationship health index.',
      },

      // 3. PRODUCT_DEPTH
      {
        dimension: 'PRODUCT_DEPTH',
        label: 'Product Depth',
        currentValue: current.productDepth,
        scenarioValue: isSimulated ? scenario!.productDepth : current.productDepth,
        change: isSimulated ? (scenario!.productDepth - current.productDepth >= 0 ? `+${scenario!.productDepth - current.productDepth}` : `${scenario!.productDepth - current.productDepth}`) : 0,
        changeType: !isSimulated ? 'UNCHANGED' : (scenario!.productDepth > current.productDepth ? 'IMPROVED' : (scenario!.productDepth < current.productDepth ? 'DECLINED' : 'UNCHANGED')),
        sourceEngine: 'Customer Products Catalog',
        explanation: isSimulated
          ? `Product cross-holdings count (${current.productDepth} → ${scenario!.productDepth}).`
          : 'Total active cross-sold banking facilities.',
      },

      // 4. ENGAGEMENT
      {
        dimension: 'ENGAGEMENT',
        label: 'Engagement Score',
        currentValue: current.engagement,
        scenarioValue: isSimulated ? scenario!.engagement : current.engagement,
        change: isSimulated ? (scenario!.engagement >= current.engagement ? `+${scenario!.engagement - current.engagement}` : `${scenario!.engagement - current.engagement}`) : 0,
        changeType: !isSimulated ? 'UNCHANGED' : (scenario!.engagement > current.engagement ? 'IMPROVED' : (scenario!.engagement < current.engagement ? 'DECLINED' : 'UNCHANGED')),
        sourceEngine: 'Interaction & Engagement Engine',
        explanation: isSimulated
          ? `Interaction cadence and customer advisory touchpoint strength (${current.engagement} → ${scenario!.engagement}).`
          : 'Customer touchpoint frequency and executive responsiveness.',
      },

      // 5. SERVICE_HEALTH
      {
        dimension: 'SERVICE_HEALTH',
        label: 'Service Health',
        currentValue: current.serviceHealth,
        scenarioValue: isSimulated ? scenario!.serviceHealth : current.serviceHealth,
        change: isSimulated ? (scenario!.serviceHealth !== current.serviceHealth ? 'Improved' : 'Maintained') : 'Current',
        changeType: !isSimulated
          ? 'UNCHANGED'
          : (['EXCELLENT', 'GOOD'].includes(scenario!.serviceHealth) && !['EXCELLENT', 'GOOD'].includes(current.serviceHealth)
            ? 'IMPROVED'
            : (['POOR', 'CRITICAL'].includes(scenario!.serviceHealth) && !['POOR', 'CRITICAL'].includes(current.serviceHealth)
              ? 'DECLINED'
              : 'UNCHANGED')),
        sourceEngine: 'Service Desk & SLA Engine',
        explanation: isSimulated
          ? `Service case resolution reflects ticket clearance (${current.serviceHealth} → ${scenario!.serviceHealth}).`
          : 'Operational stability and pending customer grievances.',
      },

      // 6. RELATIONSHIP_MOMENTUM
      {
        dimension: 'RELATIONSHIP_MOMENTUM',
        label: 'Relationship Momentum',
        currentValue: current.relationshipMomentum,
        scenarioValue: isSimulated ? scenario!.relationshipMomentum : current.relationshipMomentum,
        change: isSimulated ? (scenario!.relationshipMomentum !== current.relationshipMomentum ? 'Improved' : 'Maintained') : 'Current',
        changeType: !isSimulated
          ? 'UNCHANGED'
          : (['ACCELERATING', 'STRONG', 'STABLE'].includes(scenario!.relationshipMomentum) && ['DECLINING', 'WEAK'].includes(current.relationshipMomentum)
            ? 'IMPROVED'
            : (['DECLINING', 'WEAK'].includes(scenario!.relationshipMomentum) && !['DECLINING', 'WEAK'].includes(current.relationshipMomentum)
              ? 'DECLINED'
              : 'UNCHANGED')),
        sourceEngine: 'Relationship Intelligence Engine',
        explanation: isSimulated
          ? `Relationship trajectory changes from ${current.relationshipMomentum} to ${scenario!.relationshipMomentum}.`
          : 'Short-term vector of relationship growth or attrition risk.',
      },

      // 7. OPPORTUNITY_COVERAGE
      {
        dimension: 'OPPORTUNITY_COVERAGE',
        label: 'Opportunity Coverage',
        currentValue: `${current.opportunityCoverage}%`,
        scenarioValue: isSimulated ? `${scenario!.opportunityCoverage}%` : `${current.opportunityCoverage}%`,
        change: isSimulated ? (scenario!.opportunityCoverage >= current.opportunityCoverage ? `+${scenario!.opportunityCoverage - current.opportunityCoverage}%` : `${scenario!.opportunityCoverage - current.opportunityCoverage}%`) : '0%',
        changeType: !isSimulated ? 'UNCHANGED' : (scenario!.opportunityCoverage > current.opportunityCoverage ? 'IMPROVED' : (scenario!.opportunityCoverage < current.opportunityCoverage ? 'DECLINED' : 'UNCHANGED')),
        sourceEngine: 'Opportunity Management Subsystem',
        explanation: isSimulated
          ? `Ratio of actively progressing pipeline opportunities vs stalled opportunities.`
          : 'Active commercial expansion and pipeline health.',
        unit: '%',
      },

      // 8. COMMITMENT_HEALTH
      {
        dimension: 'COMMITMENT_HEALTH',
        label: 'Commitment Health',
        currentValue: `${current.commitmentHealth}%`,
        scenarioValue: isSimulated ? `${scenario!.commitmentHealth}%` : `${current.commitmentHealth}%`,
        change: isSimulated ? (scenario!.commitmentHealth >= current.commitmentHealth ? `+${scenario!.commitmentHealth - current.commitmentHealth}%` : `${scenario!.commitmentHealth - current.commitmentHealth}%`) : '0%',
        changeType: !isSimulated ? 'UNCHANGED' : (scenario!.commitmentHealth > current.commitmentHealth ? 'IMPROVED' : (scenario!.commitmentHealth < current.commitmentHealth ? 'DECLINED' : 'UNCHANGED')),
        sourceEngine: 'Tasks & Commitments Ledger',
        explanation: isSimulated
          ? `Task completion rate and adherence to customer commitments.`
          : 'Timeliness of promises and regulatory deadlines.',
        unit: '%',
      },

      // 9. ACTIVITY_HEALTH
      {
        dimension: 'ACTIVITY_HEALTH',
        label: 'Activity Health',
        currentValue: `${current.activityHealth}%`,
        scenarioValue: isSimulated ? `${scenario!.activityHealth}%` : `${current.activityHealth}%`,
        change: isSimulated ? (scenario!.activityHealth >= current.activityHealth ? `+${scenario!.activityHealth - current.activityHealth}%` : `${scenario!.activityHealth - current.activityHealth}%`) : '0%',
        changeType: !isSimulated ? 'UNCHANGED' : (scenario!.activityHealth > current.activityHealth ? 'IMPROVED' : (scenario!.activityHealth < current.activityHealth ? 'DECLINED' : 'UNCHANGED')),
        sourceEngine: 'Interaction Intelligence Engine',
        explanation: isSimulated
          ? `Advisory interaction frequency and client contact recency.`
          : 'Touchpoint recency within SLA cadence.',
        unit: '%',
      },

      // 10. RELATIONSHIP_STATE
      {
        dimension: 'RELATIONSHIP_STATE',
        label: 'Relationship State',
        currentValue: current.relationshipState.replace('_', ' '),
        scenarioValue: isSimulated ? scenario!.relationshipState.replace('_', ' ') : current.relationshipState.replace('_', ' '),
        change: isSimulated ? (scenario!.relationshipState !== current.relationshipState ? 'Transitioned' : 'Unchanged') : 'Current',
        changeType: !isSimulated ? 'UNCHANGED' : (scenario!.relationshipState !== current.relationshipState ? 'IMPROVED' : 'UNCHANGED'),
        sourceEngine: 'Relationship Digital Twin',
        explanation: isSimulated
          ? `Holistic governance state transitions from ${current.relationshipState} to ${scenario!.relationshipState}.`
          : 'Categorical operational state of customer relationship.',
      },
    ];

    return dimensions.map((d) => ({
      ...d,
      simulatedValue: d.scenarioValue,
      status: d.changeType,
      currentValueFormatted: String(d.currentValue),
      simulatedValueFormatted: String(d.scenarioValue),
    }));
  }

  /**
   * Identifies supporting signals for a scenario outcome
   */
  private extractSupportingSignals(
    current: RelationshipValueSnapshotDTO,
    scenario: RelationshipValueSnapshotDTO
  ): SupportingSignalItem[] {
    const signals: SupportingSignalItem[] = [];

    if (scenario.serviceHealth === 'GOOD' && current.serviceHealth !== 'GOOD') {
      signals.push({
        code: 'SERVICE_RECOVERY',
        label: 'Service Friction Resolved',
        category: 'SERVICE',
        impact: 'Removes customer churn catalyst and unlocks relationship expansion.',
      });
    }

    if (scenario.commitmentHealth > current.commitmentHealth) {
      signals.push({
        code: 'COMMITMENT_COMPLETED',
        label: 'Customer Commitments Honored',
        category: 'OPERATIONAL',
        impact: 'Fulfills promises made to client leadership, restoring governance trust.',
      });
    }

    if (scenario.coreScore > current.coreScore) {
      signals.push({
        code: 'CORE_SCORE_BOOST',
        label: 'CORE Health Recovery',
        category: 'RELATIONSHIP',
        impact: `Composite score advances by +${scenario.coreScore - current.coreScore} points.`,
      });
    }

    if (scenario.opportunityCoverage > current.opportunityCoverage) {
      signals.push({
        code: 'PIPELINE_UNBLOCKED',
        label: 'Commercial Pipeline Unblocked',
        category: 'GROWTH',
        impact: 'Resolves opportunity stagnation and moves high-value transactions forward.',
      });
    }

    return signals;
  }

  /**
   * Retrieves current Relationship Value Profile
   */
  async getCurrentProfile(
    customerId: number,
    user: SafeUser,
    requestId: string
  ): Promise<RelationshipValueProfileDTO> {
    await resourceAuth.authorizeCustomer(user, customerId, 'RELATIONSHIP_VALUE_READ', requestId);

    // Consume Phase 30 Strategy Simulator Base Snapshot
    const baseState = await strategySimulatorService.getBaseSnapshot(customerId, user);
    const [cust] = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);

    const currentSnapshot = this.snapshotFromState(baseState, cust?.name || '', cust?.customerCode || '');
    const dimensions = this.compareSnapshots(currentSnapshot, null);
    const valueBreakdown = await this.buildValueBreakdown(customerId, baseState);

    // Audit log
    await auditRepository.createLog({
      actorId: user.employeeId,
      actorName: user.name,
      action: 'RELATIONSHIP_VALUE_VIEWED',
      resourceType: 'CUSTOMER_RELATIONSHIP_VALUE',
      resourceId: String(customerId),
      requestId,
      outcome: 'SUCCESS',
      metadata: {
        customerId,
        coreScore: currentSnapshot.coreScore,
        relationshipValue: currentSnapshot.relationshipValue,
      },
    });

    return {
      customerId,
      customerCode: currentSnapshot.customerCode,
      customerName: currentSnapshot.customerName,
      dataAsOf: currentSnapshot.dataAsOf,
      isSimulated: false,
      currentSnapshot,
      baseSnapshot: currentSnapshot,
      scenarioSnapshot: null,
      dimensions,
      supportingSignals: [],
      valueBreakdown,
      explanation: `Current relationship profile for ${currentSnapshot.customerName} shows a CORE Score of ${currentSnapshot.coreScore} (${currentSnapshot.relationshipMomentum}) with ${currentSnapshot.productDepth} active products.`,
      limitations: [
        'Monetary relationship value reflects recorded book balances and is not speculative.',
        'Profile metrics are updated deterministically from core ledger and service logs.',
      ],
    };
  }

  /**
   * Compares the current relationship profile against a simulated Phase 30 scenario
   */
  async compareScenario(
    customerId: number,
    scenarioId: string | number,
    user: SafeUser,
    requestId: string
  ): Promise<RelationshipValueProfileDTO> {
    await resourceAuth.authorizeCustomer(user, customerId, 'RELATIONSHIP_VALUE_SCENARIO_COMPARE', requestId);

    // 1. Consume Phase 30 Strategy Simulator
    const scenario = await strategySimulatorService.getScenario(scenarioId, user);
    const simResult = await strategySimulatorService.simulateScenario(
      {
        customerId: scenario.customerId,
        actions: scenario.actions,
        scenarioName: scenario.name,
        description: scenario.description,
        scenarioId: scenario.scenarioId,
      },
      user
    );
    const [cust] = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);

    const effectiveScenarioName = scenario?.name || simResult.scenarioName || simResult.scenarioId;

    const currentSnapshot = this.snapshotFromState(simResult.baseSnapshot, cust?.name || '', cust?.customerCode || '');
    const scenarioSnapshot = this.snapshotFromState(
      simResult.simulatedSnapshot,
      cust?.name || '',
      cust?.customerCode || '',
      simResult.scenarioId,
      simResult.decisionTraceId
    );

    const dimensions = this.compareSnapshots(currentSnapshot, scenarioSnapshot);
    const supportingSignals = this.extractSupportingSignals(currentSnapshot, scenarioSnapshot);
    const valueBreakdown = await this.buildValueBreakdown(customerId, simResult.baseSnapshot);

    // 2. Create Decision Trace (Phase 29 Integration)
    let decisionTraceId = simResult.decisionTraceId;
    try {
      const trace = await decisionTraceService.recordDecisionTrace(
        {
          customerId,
          sourceModule: 'STRATEGY_SIMULATOR',
          sourceEngine: 'Relationship Value Intelligence',
          decisionType: 'SIMULATION_SCENARIO',
          recommendationTitle: `Relationship Value Impact: ${effectiveScenarioName}`,
          recommendationSummary: `Deterministic multi-dimensional relationship profile evaluation under scenario ${simResult.scenarioId}.`,
          decisionMode: 'DETERMINISTIC',
          evidence: [
            {
              evidenceType: 'STRATEGY_SIMULATION',
              sourceEngine: 'Strategy Simulator (Phase 30)',
              sourceEntityType: 'SCENARIO',
              sourceEntityId: simResult.scenarioId,
              description: `Simulated ${simResult.intermediateSteps?.length || 0} sequential business actions with projected outcome.`,
              observedValue: String(simResult.intermediateSteps?.length || 0),
              contributionType: 'PRIMARY',
            },
            {
              evidenceType: 'CORE_SCORE_ENGINE',
              sourceEngine: 'CORE Score Engine',
              sourceEntityType: 'CUSTOMER',
              sourceEntityId: String(customerId),
              description: `Projected CORE score delta from ${currentSnapshot.coreScore} to ${scenarioSnapshot.coreScore}.`,
              observedValue: String(scenarioSnapshot.coreScore - currentSnapshot.coreScore),
              previousValue: String(currentSnapshot.coreScore),
              contributionType: 'PRIMARY',
            },
          ],
        },
        user,
        requestId
      );
      if (trace?.decisionId) {
        decisionTraceId = trace.decisionId;
      }
    } catch (e) {
      console.warn('[RelationshipValueService] Decision trace link warning:', e);
    }

    // 3. Persist Snapshot in Database for audit and historical tracking
    await relationshipValueRepository.createSnapshot({
      customerId,
      relationshipValue: scenarioSnapshot.relationshipValue,
      coreScore: scenarioSnapshot.coreScore,
      productDepth: scenarioSnapshot.productDepth,
      engagement: scenarioSnapshot.engagement,
      serviceHealth: scenarioSnapshot.serviceHealth,
      relationshipMomentum: scenarioSnapshot.relationshipMomentum,
      opportunityCoverage: scenarioSnapshot.opportunityCoverage,
      commitmentHealth: scenarioSnapshot.commitmentHealth,
      activityHealth: scenarioSnapshot.activityHealth,
      relationshipState: scenarioSnapshot.relationshipState,
      scenarioId: simResult.scenarioId,
      decisionTraceId,
      metadata: {
        simulationSource: 'Phase 30 Strategy Simulator',
        scenarioName: effectiveScenarioName,
      },
    });

    // 4. Audit Log
    await auditRepository.createLog({
      actorId: user.employeeId,
      actorName: user.name,
      action: 'RELATIONSHIP_VALUE_SCENARIO_COMPARED',
      resourceType: 'RELATIONSHIP_SCENARIO',
      resourceId: String(scenarioId),
      requestId,
      outcome: 'SUCCESS',
      metadata: {
        customerId,
        scenarioId: simResult.scenarioId,
        scoreDelta: scenarioSnapshot.coreScore - currentSnapshot.coreScore,
        decisionTraceId,
      },
    });

    return {
      customerId,
      customerCode: currentSnapshot.customerCode,
      customerName: currentSnapshot.customerName,
      dataAsOf: new Date().toISOString(),
      isSimulated: true,
      scenarioId: simResult.scenarioId,
      scenarioName: effectiveScenarioName,
      decisionTraceId,
      currentSnapshot,
      baseSnapshot: currentSnapshot,
      scenarioSnapshot,
      dimensions,
      supportingSignals,
      valueBreakdown,
      explanation: `Implementing scenario "${effectiveScenarioName}" enhances the relationship profile: CORE Score advances +${scenarioSnapshot.coreScore - currentSnapshot.coreScore} pts, Service Health improves to ${scenarioSnapshot.serviceHealth}, and Engagement rises to ${scenarioSnapshot.engagement}.`,
      limitations: [
        'Relationship Value (financial) is not recalculated because monetary revenue models are deliberately excluded.',
        'All projections are deterministic and require authorized operational execution to take effect in production.',
      ],
    };
  }

  /**
   * Retrieves historical relationship profile timeline
   */
  async getHistory(
    customerId: number,
    user: SafeUser,
    requestId: string
  ): Promise<RelationshipValueHistoryDTO> {
    await resourceAuth.authorizeCustomer(user, customerId, 'RELATIONSHIP_VALUE_HISTORY', requestId);

    const [cust] = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
    if (!cust) {
      throw new BankingError('NOT_FOUND', `Customer #${customerId} not found.`, 404);
    }

    const snapshots = await relationshipValueRepository.getHistoricalSnapshots(customerId, 90);

    await auditRepository.createLog({
      actorId: user.employeeId,
      actorName: user.name,
      action: 'RELATIONSHIP_VALUE_HISTORY_VIEWED',
      resourceType: 'CUSTOMER_RELATIONSHIP_VALUE_HISTORY',
      resourceId: String(customerId),
      requestId,
      outcome: 'SUCCESS',
      metadata: { customerId, recordCount: snapshots.length },
    });

    if (snapshots.length === 0) {
      return {
        customerId,
        customerCode: cust.customerCode,
        customerName: cust.name,
        available: false,
        timeline: [],
        trendSummary: {
          coreScoreTrend: 'STABLE',
          engagementTrend: 'STABLE',
          serviceHealthTrend: 'STABLE',
          earliestDate: new Date().toISOString(),
          latestDate: new Date().toISOString(),
          recordCount: 0,
        },
        notice: 'Historical relationship profile unavailable.',
      };
    }

    const now = Date.now();
    const timeline = snapshots.map((s) => ({
      date: s.snapshotDate || s.capturedAt.split('T')[0],
      daysAgo: Math.max(0, Math.round((now - new Date(s.capturedAt).getTime()) / (1000 * 60 * 60 * 24))),
      coreScore: s.coreScore,
      engagement: s.engagement,
      serviceHealth: s.serviceHealth,
      relationshipMomentum: s.relationshipMomentum,
      relationshipValue: s.relationshipValue,
      productDepth: s.productDepth,
      commitmentHealth: s.commitmentHealth,
      activityHealth: s.activityHealth,
    }));

    const earliest = timeline[timeline.length - 1];
    const latest = timeline[0];

    const scoreTrend = latest.coreScore > earliest.coreScore ? 'IMPROVED' : (latest.coreScore < earliest.coreScore ? 'DECLINED' : 'STABLE');
    const engTrend = latest.engagement > earliest.engagement ? 'IMPROVED' : (latest.engagement < earliest.engagement ? 'DECLINED' : 'STABLE');

    return {
      customerId,
      customerCode: cust.customerCode,
      customerName: cust.name,
      available: true,
      timeline,
      trendSummary: {
        coreScoreTrend: scoreTrend,
        engagementTrend: engTrend,
        serviceHealthTrend: 'STABLE',
        earliestDate: earliest.date,
        latestDate: latest.date,
        recordCount: timeline.length,
      },
    };
  }

  /**
   * Portfolio-level relationship value aggregation
   */
  async getPortfolioAnalytics(
    user: SafeUser,
    requestId: string,
    filters: Record<string, any> = {}
  ): Promise<PortfolioRelationshipValueAnalyticsDTO> {
    let authorizedCustomerIds: number[] | undefined;

    // RBAC: If officer is an RM, restrict to portfolio customers
    if (user.role === 'RELATIONSHIP_MANAGER') {
      const assigned = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.assignedRmId, user.id));
      authorizedCustomerIds = assigned.map((c) => c.id);
    }

    const result = await relationshipValueRepository.getPortfolioAggregation(authorizedCustomerIds);

    await auditRepository.createLog({
      actorId: user.employeeId,
      actorName: user.name,
      action: 'RELATIONSHIP_VALUE_VIEWED',
      resourceType: 'PORTFOLIO_RELATIONSHIP_VALUE',
      resourceId: 'PORTFOLIO_ALL',
      requestId,
      outcome: 'SUCCESS',
      metadata: {
        userRole: user.role,
        customerCount: result.totalCustomers,
      },
    });

    return result;
  }

  /**
   * Search relationship value snapshots and scenarios
   */
  async searchSnapshots(query: string, user: SafeUser): Promise<any[]> {
    return relationshipValueRepository.searchSnapshots(query, user);
  }

  /**
   * Unified helper to get current profile or compare against a scenario
   */
  async getRelationshipValueProfile(
    customerId: number,
    scenarioId: string | number | undefined,
    user: SafeUser,
    requestId: string
  ): Promise<RelationshipValueProfileDTO> {
    if (scenarioId) {
      return this.compareScenario(customerId, scenarioId, user, requestId);
    }
    return this.getCurrentProfile(customerId, user, requestId);
  }

  /**
   * Helper to retrieve historical timeline
   */
  async getHistoricalProfile(
    customerId: number,
    user: SafeUser,
    requestId: string
  ): Promise<RelationshipValueHistoryDTO> {
    return this.getHistory(customerId, user, requestId);
  }

  /**
   * Captures and persists a live snapshot in PostgreSQL
   */
  async createLiveSnapshot(
    customerId: number,
    user: SafeUser,
    requestId: string,
    notes?: string
  ): Promise<RelationshipValueSnapshotDTO> {
    await resourceAuth.authorizeCustomer(user, customerId, 'RELATIONSHIP_VALUE_SNAPSHOT_CREATE', requestId);
    const baseState = await strategySimulatorService.getBaseSnapshot(customerId, user);
    const [cust] = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);

    const snapshot = await relationshipValueRepository.createSnapshot({
      customerId,
      relationshipValue: baseState.relationshipValue || cust?.relationshipValue || 0,
      coreScore: baseState.coreScore,
      productDepth: baseState.productDepth,
      engagement: baseState.engagementScore,
      serviceHealth: baseState.serviceHealth,
      relationshipMomentum: baseState.relationshipMomentum,
      opportunityCoverage: baseState.openOpportunitiesCount ? 70 : 50,
      commitmentHealth: baseState.overdueTasksCount === 0 ? 90 : 70,
      activityHealth: Math.max(30, 100 - (baseState.daysSinceLastInteraction || 10) * 2),
      relationshipState: baseState.relationshipState,
      metadata: { capturedBy: user.name, notes: notes || 'Live manual capture' },
    });

    await auditRepository.createLog({
      actorId: user.employeeId,
      actorName: user.name,
      action: 'RELATIONSHIP_VALUE_SNAPSHOT_CREATED',
      resourceType: 'RELATIONSHIP_VALUE_SNAPSHOT',
      resourceId: String(snapshot.id),
      requestId,
      outcome: 'SUCCESS',
      metadata: { customerId, snapshotId: snapshot.id },
    });

    return snapshot;
  }

  /**
   * Simulates a dynamic strategy and compares Current vs Simulated Relationship Profile
   */
  async simulateAndCompareScenario(
    customerId: number,
    input: { name: string; actions: Array<{ actionType: any; orderIndex?: number; label?: string }> },
    user: SafeUser,
    requestId: string
  ): Promise<RelationshipValueProfileDTO> {
    await resourceAuth.authorizeCustomer(user, customerId, 'RELATIONSHIP_VALUE_SIMULATE', requestId);

    const createdScenario = await strategySimulatorService.createScenario(
      {
        customerId,
        name: input.name,
        description: 'Phase 32 What-If Relationship Profile Simulation',
        actions: input.actions.map((a, i) => ({
          actionType: a.actionType,
          orderIndex: a.orderIndex ?? i,
          label: a.label || a.actionType,
        })),
      },
      user
    );

    return this.compareScenario(customerId, createdScenario.scenarioId, user, requestId);
  }
}

export const relationshipValueService = new RelationshipValueService();
