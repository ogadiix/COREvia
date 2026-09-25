import { db } from '../db/index.ts';
import {
  customers,
  accounts,
  accountBalances,
  loans,
  customerScores,
  customerScoreHistory,
  serviceCases,
  opportunities,
  tasks,
  interactions,
  documents,
  onboardingApplications,
  nextBestActions,
  customerOpportunityRadar,
  relationshipEvents,
  relationshipStateHistory,
  relationshipSnapshots,
  relationshipSignalEvents,
  relationshipActionTrace,
  users,
} from '../db/schema.ts';
import { eq, desc, and, or, sql, gte, lte } from 'drizzle-orm';
import { BankingError } from '../lib/errors.ts';
import { resourceAuth } from '../lib/resourceAuth.ts';
import { SafeUser } from './auth.service.ts';
import {
  RelationshipState,
  RelationshipTwinOverview,
  RelationshipMaterialChange,
  RelationshipEvidenceItem,
  RelationshipHealthMetric,
  RelationshipStateMapNode,
  RelationshipHeldProduct,
  RelationshipProductWhitespace,
  RelationshipCommitmentItem,
  BeforeYouActAdvisory,
  RelationshipSnapshot,
  RelationshipSignal,
  RelationshipEvent,
  RelationshipActionTraceItem,
} from '../types/index.ts';
import { formatINR } from '../data/mockIndianBankingData.ts';

export const relationshipTwinService = {
  /**
   * Fetch complete Relationship Twin orchestration for a customer
   */
  async getRelationshipTwin(
    customerId: number,
    user: SafeUser | any
  ): Promise<RelationshipTwinOverview> {
    // 1. Authorize access
    await resourceAuth.authorizeCustomer(user, customerId, 'VIEW_RELATIONSHIP_TWIN');

    // 2. Fetch Customer Record
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      throw new BankingError('CUSTOMER_NOT_FOUND', `Customer with ID ${customerId} not found`, 404);
    }

    // 3. Fetch all parallel subsystem records
    const [
      customerAccs,
      customerLoans,
      scoreRecord,
      scoreHistory,
      casesList,
      oppsList,
      tasksList,
      interactionsList,
      docsList,
      onboardingList,
      nbas,
      radarItems,
      snapshotsList,
      signalEventsList,
      actionTracesList,
      timelineEventsList,
    ] = await Promise.all([
      db
        .select({
          id: accounts.id,
          accountNumber: accounts.accountNumber,
          customerId: accounts.customerId,
          accountType: accounts.accountType,
          schemeCode: accounts.schemeCode,
          schemeName: accounts.schemeName,
          currency: accounts.currency,
          interestRate: accounts.interestRate,
          status: accounts.status,
          branchCode: accounts.branchCode,
          openDate: accounts.openDate,
          availableBalance: accountBalances.availableBalance,
        })
        .from(accounts)
        .leftJoin(accountBalances, eq(accounts.id, accountBalances.accountId))
        .where(eq(accounts.customerId, customerId)),
      db.select().from(loans).where(eq(loans.customerId, customerId)),
      db.select().from(customerScores).where(eq(customerScores.customerId, customerId)).limit(1),
      db
        .select()
        .from(customerScoreHistory)
        .where(eq(customerScoreHistory.customerId, customerId))
        .orderBy(desc(customerScoreHistory.recordedDate))
        .limit(5),
      db.select().from(serviceCases).where(eq(serviceCases.customerId, customerId)).orderBy(desc(serviceCases.createdAt)),
      db.select().from(opportunities).where(eq(opportunities.customerId, customerId)).orderBy(desc(opportunities.updatedAt)),
      db.select().from(tasks).where(eq(tasks.customerId, customerId)).orderBy(desc(tasks.dueDate)),
      db.select().from(interactions).where(eq(interactions.customerId, customerId)).orderBy(desc(interactions.timestamp)).limit(10),
      db.select().from(documents).where(eq(documents.customerId, customerId)).orderBy(desc(documents.createdAt)),
      db
        .select()
        .from(onboardingApplications)
        .where(eq(onboardingApplications.customerId, customerId))
        .orderBy(desc(onboardingApplications.createdAt))
        .limit(1),
      db.select().from(nextBestActions).where(eq(nextBestActions.customerId, customerId)),
      db.select().from(customerOpportunityRadar).where(eq(customerOpportunityRadar.customerId, customerId)),
      db
        .select()
        .from(relationshipSnapshots)
        .where(eq(relationshipSnapshots.customerId, customerId))
        .orderBy(desc(relationshipSnapshots.snapshotDate)),
      db
        .select()
        .from(relationshipSignalEvents)
        .where(eq(relationshipSignalEvents.customerId, customerId))
        .orderBy(desc(relationshipSignalEvents.timestamp)),
      db
        .select()
        .from(relationshipActionTrace)
        .where(eq(relationshipActionTrace.customerId, customerId))
        .orderBy(desc(relationshipActionTrace.createdAt)),
      db
        .select()
        .from(relationshipEvents)
        .where(eq(relationshipEvents.customerId, customerId))
        .orderBy(desc(relationshipEvents.timestamp)),
    ]);

    // 4. Calculate Financial Metrics
    const totalDeposits = customerAccs.reduce((sum, a) => sum + parseFloat(a.availableBalance || '0'), 0);
    const totalLoans = customerLoans.reduce((sum, l) => sum + parseFloat(l.outstandingPrincipal || '0'), 0);
    const relationshipValue = totalDeposits + totalLoans;
    const activeProductsCount = customerAccs.length + customerLoans.length;

    // 5. CORE Score & Momentum
    const coreScore = scoreRecord[0]?.coreScore || 84;
    const previousCoreScore = scoreHistory[0]?.coreScore || (scoreHistory[1]?.coreScore || 86);
    const scoreDelta = coreScore - previousCoreScore;
    const relationshipMomentum = scoreDelta > 0 ? 'ACCELERATING' : scoreDelta < 0 ? 'DECLINING' : 'STABLE';

    // 6. Open Entities & Metrics
    const openCases = casesList.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED');
    const openOpps = oppsList.filter((o) => o.stage !== 'WON' && o.stage !== 'LOST');
    const openTasks = tasksList.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
    const replacementDocs = docsList.filter((d) => d.status === 'REPLACEMENT_REQUIRED' || d.replacementRequired);

    // Recency: Days since last RM interaction
    const lastInteraction = interactionsList[0];
    let daysSinceLastInteraction = 0;
    if (lastInteraction && lastInteraction.timestamp) {
      const diffTime = Math.abs(new Date().getTime() - new Date(lastInteraction.timestamp).getTime());
      daysSinceLastInteraction = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } else {
      daysSinceLastInteraction = 12; // canonical default
    }

    // SLA risk cases (< 24 hours or past due)
    const now = new Date();
    const slaRiskCases = openCases.filter((c) => {
      if (!c.slaDueDate) return false;
      const due = new Date(c.slaDueDate);
      const hoursRemaining = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursRemaining <= 48 || c.priority === 'HIGH' || c.priority === 'CRITICAL';
    });

    // Stalled opportunities (> 5 days without activity in Proposal or Negotiation)
    const stalledOpps = openOpps.filter((o) => {
      if (o.stage === 'PROPOSAL' || o.stage === 'NEGOTIATION' || o.stage === 'UNDERWRITING') {
        const updateTime = o.updatedAt ? new Date(o.updatedAt).getTime() : new Date().getTime();
        const days = Math.floor((now.getTime() - updateTime) / (1000 * 60 * 60 * 24));
        return days >= 5;
      }
      return false;
    });

    // 7. Deterministic State Derivation & "Why This State?"
    let calculatedState: RelationshipState = 'STABLE';
    let stateReason = 'Stable relationship health across all business and service lines.';
    const whyFactors: Array<{
      reason: string;
      engine: string;
      link?: { module: string; id?: any };
      details: string;
      severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'POSITIVE';
    }> = [];

    const hasCriticalServiceBreach = openCases.some((c) => c.priority === 'CRITICAL');
    const hasSlaRisk = slaRiskCases.length > 0;
    const hasScoreDecline = scoreDelta < 0;
    const hasStalledDeal = stalledOpps.length > 0;
    const hasReplacementDoc = replacementDocs.length > 0;
    const hasRecencyGap = daysSinceLastInteraction >= 10;
    const hasActiveOnboarding = onboardingList.length > 0 && onboardingList[0].status !== 'COMPLETED';

    if (hasCriticalServiceBreach) {
      calculatedState = 'SERVICE_RECOVERY';
      stateReason = 'Customer has critical open service issues requiring immediate supervisory intervention.';
    } else if (hasSlaRisk || hasScoreDecline || hasStalledDeal || hasReplacementDoc || hasRecencyGap) {
      calculatedState = 'ATTENTION_REQUIRED';
      stateReason =
        'Relationship exhibits operational friction: open service ticket near SLA, recent score calibration decline, stalled proposal, and document replacement pending.';
    } else if (hasActiveOnboarding) {
      calculatedState = 'ONBOARDING_ACTIVE';
      stateReason = 'Customer has an active onboarding or account opening workflow in progress.';
    } else if (openOpps.length > 0 && totalDeposits > 1000000) {
      calculatedState = 'GROWING';
      stateReason = 'Active opportunity pipeline combined with expanding portfolio and positive liquidity inflows.';
    } else if (openTasks.length > 3) {
      calculatedState = 'FOLLOW_UP_REQUIRED';
      stateReason = 'Multiple officer commitments and follow-up reviews are pending execution.';
    } else if (daysSinceLastInteraction <= 7 && coreScore >= 80) {
      calculatedState = 'ENGAGED';
      stateReason = 'Frequent proactive communication and high engagement touchpoints across digital and branch channels.';
    }

    // Build "Why This State?" structured factors
    if (slaRiskCases.length > 0) {
      const topCase = slaRiskCases[0];
      whyFactors.push({
        reason: `Service Case #${topCase.caseNumber} approaching SLA deadline`,
        engine: 'Service Desk SLA Tracker',
        link: { module: 'cases', id: topCase.caseNumber },
        details: `${topCase.title} is currently ${topCase.status} with High Priority. Action needed to avoid regulatory breach.`,
        severity: 'CRITICAL',
      });
    }

    if (hasScoreDecline) {
      whyFactors.push({
        reason: `CORE Score calibrated down (${previousCoreScore} → ${coreScore})`,
        engine: 'CORE Score Engine v3.2',
        details: `Recent recalibration penalized the relationship due to open service inquiry and interaction recency gap.`,
        severity: 'WARNING',
      });
    }

    if (stalledOpps.length > 0) {
      const topOpp = stalledOpps[0];
      whyFactors.push({
        reason: `Opportunity #${topOpp.opportunityCode} stalled at ${topOpp.stage} stage`,
        engine: 'Opportunity Radar Engine',
        link: { module: 'opportunities', id: topOpp.opportunityCode },
        details: `${topOpp.title} (Value: ${formatINR(parseFloat(topOpp.expectedValue || '0'))}) has had no customer contact in over 5 days.`,
        severity: 'WARNING',
      });
    }

    if (replacementDocs.length > 0) {
      const topDoc = replacementDocs[0];
      whyFactors.push({
        reason: `cKYC Document ${topDoc.documentCode} requires replacement`,
        engine: 'Document Intelligence Engine',
        link: { module: 'documents', id: topDoc.documentCode },
        details: `${topDoc.documentType} rejected or outdated; replacement due by ${topDoc.replacementDueDate || '20 Sep 2026'}.`,
        severity: 'WARNING',
      });
    }

    if (hasRecencyGap) {
      whyFactors.push({
        reason: `${daysSinceLastInteraction} days since last RM interaction`,
        engine: 'Interaction Recency Tracker',
        link: { module: 'interactions' },
        details: `Exceeds the 10-day institutional contact frequency threshold for High Net Worth / Wealth segment.`,
        severity: 'INFO',
      });
    }

    if (whyFactors.length === 0) {
      whyFactors.push({
        reason: 'Stable multi-product holdings and clean repayment record',
        engine: 'CORE Score Engine',
        details: 'All accounts and facilities performing within normal institutional parameters.',
        severity: 'POSITIVE',
      });
    }

    // 8. "What Changed?" (Material changes comparing to previous state/snapshot)
    const latestSnapshot = snapshotsList[0];
    const materialChanges: RelationshipMaterialChange[] = [];

    if (latestSnapshot && latestSnapshot.materialChanges) {
      try {
        const parsed = JSON.parse(latestSnapshot.materialChanges);
        if (Array.isArray(parsed)) {
          materialChanges.push(...parsed);
        }
      } catch (e) {
        // fallback
      }
    }

    if (materialChanges.length === 0) {
      // Default material changes reflecting recent events
      materialChanges.push(
        {
          category: 'SERVICE',
          changeType: 'ESCALATED',
          title: 'High-priority Service Case CAS-2026-0942 approaching SLA',
          oldValue: '0 Open Cases',
          newValue: '1 High Priority Case',
          severity: 'CRITICAL',
          evidence: 'Physical NRI nominee verification pending with NRI operations cell.',
          source: 'Service Desk Engine',
        },
        {
          category: 'CORE_SCORE',
          changeType: 'DECLINED',
          title: 'CORE Score adjusted from 86 to 84 (-2 pts)',
          oldValue: 86,
          newValue: 84,
          severity: 'WARNING',
          evidence: 'Automated daily adjustment triggered by unresolved grievance and recency gap.',
          source: 'CORE Score Engine',
        },
        {
          category: 'OPPORTUNITY',
          changeType: 'CHANGED',
          title: 'Opportunity OPP-2026-10482 stalled at Proposal (6d)',
          oldValue: 'Active Discussion',
          newValue: 'Stalled (6d)',
          severity: 'WARNING',
          evidence: 'Customer awaiting revised term sheet from RM.',
          source: 'Opportunity Radar Engine',
        },
        {
          category: 'DOCUMENT',
          changeType: 'CHANGED',
          title: 'Utility Bill marked Replacement Required',
          oldValue: 'VERIFIED',
          newValue: 'REPLACEMENT_REQUIRED',
          severity: 'WARNING',
          evidence: 'DOC-2026-004823 statement date exceeds 90 days validity threshold.',
          source: 'Document Intelligence Engine',
        }
      );
    }

    // 9. State Map Nodes
    const stateMapNodes: RelationshipStateMapNode[] = [
      {
        id: 'node-customer',
        name: 'Identity & Governance',
        status: replacementDocs.length > 0 ? 'WARNING' : 'HEALTHY',
        keyMetric: `cKYC: ${replacementDocs.length > 0 ? 'Replacement Due' : 'Verified'}`,
        signalCount: replacementDocs.length,
        description: 'Customer profile, regulatory identity, tax residency, and risk classification.',
        items: [
          `Risk Tier: ${customer.riskCategory}`,
          `PAN: ${customer.panNumber || 'Verified'}`,
          `Segment: ${customer.entityType || 'Private Banking'}`,
        ],
      },
      {
        id: 'node-financial',
        name: 'Financial Relationship',
        status: 'HEALTHY',
        keyMetric: formatINR(relationshipValue),
        signalCount: 0,
        description: 'CASA deposits, term deposits, lending facilities, and total balance sheet footprint.',
        items: [
          `CASA Balance: ${formatINR(totalDeposits)}`,
          `Credit Outstandings: ${formatINR(totalLoans)}`,
          `Active Accounts: ${activeProductsCount}`,
        ],
      },
      {
        id: 'node-engagement',
        name: 'Engagement & Recency',
        status: hasRecencyGap ? 'WARNING' : 'HEALTHY',
        keyMetric: `${daysSinceLastInteraction}d ago`,
        signalCount: hasRecencyGap ? 1 : 0,
        description: 'RM interaction cadence, communication recency, and customer responsiveness.',
        items: [
          `Last Touchpoint: ${lastInteraction?.timestamp ? String(lastInteraction.timestamp).substring(0, 10) : '07 Sep 2026'}`,
          `Channel: ${lastInteraction?.channel || 'Branch Visit'}`,
          `Sentiment: ${lastInteraction?.sentiment || 'Positive'}`,
        ],
      },
      {
        id: 'node-service',
        name: 'Service Health',
        status: slaRiskCases.length > 0 ? 'CRITICAL' : openCases.length > 0 ? 'WARNING' : 'HEALTHY',
        keyMetric: `${openCases.length} Open (${slaRiskCases.length} SLA Risk)`,
        signalCount: slaRiskCases.length,
        description: 'Open service tickets, grievance escalations, and fulfillment turn-around time.',
        items: openCases.map((c) => `${c.caseNumber} - ${c.title.substring(0, 32)}... (${c.priority})`),
      },
      {
        id: 'node-growth',
        name: 'Growth & Opportunities',
        status: stalledOpps.length > 0 ? 'WARNING' : 'HEALTHY',
        keyMetric: `${openOpps.length} Deals (${formatINR(openOpps.reduce((s, o) => s + parseFloat(o.expectedValue || '0'), 0))})`,
        signalCount: stalledOpps.length,
        description: 'Active cross-sell pipeline, term deposit recommendations, and expansion potential.',
        items: openOpps.map((o) => `${o.opportunityCode} - ${o.stage} (${formatINR(parseFloat(o.expectedValue || '0'))})`),
      },
      {
        id: 'node-operations',
        name: 'Commitments & Tasks',
        status: openTasks.length > 0 ? 'ATTENTION' : 'HEALTHY',
        keyMetric: `${openTasks.length} Pending Actions`,
        signalCount: openTasks.length,
        description: 'Customer commitments, RM obligations, follow-up deadlines, and SLA promises.',
        items: openTasks.slice(0, 3).map((t) => `${t.title.substring(0, 36)}... (Due: ${t.dueDate || 'Soon'})`),
      },
    ];

    // 10. Relationship Health Breakdown
    const healthBreakdown: RelationshipHealthMetric[] = [
      {
        metric: 'CORE Score',
        value: `${coreScore}/100`,
        trend: scoreDelta > 0 ? 'UP' : scoreDelta < 0 ? 'DOWN' : 'STABLE',
        source: 'CORE Score Engine v3.2',
        lastUpdated: '17 Sep 2026 18:00',
        benchmark: 'Tier 1 Benchmark: 85+',
      },
      {
        metric: 'Relationship Momentum',
        value: relationshipMomentum,
        trend: relationshipMomentum === 'ACCELERATING' ? 'UP' : relationshipMomentum === 'DECLINING' ? 'DOWN' : 'STABLE',
        source: 'Velocity & Momentum Engine',
        lastUpdated: 'Today',
        benchmark: 'Target: STABLE or POSITIVE',
      },
      {
        metric: 'Service Health Score',
        value: slaRiskCases.length > 0 ? '64/100' : '92/100',
        trend: slaRiskCases.length > 0 ? 'DOWN' : 'STABLE',
        source: 'Service Desk SLA Tracker',
        lastUpdated: 'Live',
        benchmark: 'Target: 90+',
      },
      {
        metric: 'Engagement & Recency',
        value: `${Math.max(0, 100 - daysSinceLastInteraction * 3)}/100`,
        trend: hasRecencyGap ? 'DOWN' : 'STABLE',
        source: 'Interaction Recency Tracker',
        lastUpdated: `${daysSinceLastInteraction}d ago`,
        benchmark: 'Target: < 10 days between touches',
      },
      {
        metric: 'Product Depth',
        value: `${activeProductsCount} Products (Score: 88/100)`,
        trend: 'STABLE',
        source: 'Financial Relationship Engine',
        lastUpdated: 'Monthly BOD',
        benchmark: 'High Net Worth Avg: 4.5',
      },
      {
        metric: 'Opportunity Activity',
        value: stalledOpps.length > 0 ? '70/100' : '85/100',
        trend: stalledOpps.length > 0 ? 'DOWN' : 'UP',
        source: 'Opportunity Radar Engine',
        lastUpdated: '6d ago',
        benchmark: 'Target: Active weekly motion',
      },
      {
        metric: 'Task & Commitment Completion',
        value: '80/100',
        trend: 'STABLE',
        source: 'Task Management Engine',
        lastUpdated: 'Today',
        benchmark: 'Target: 95% on-time execution',
      },
    ];

    // 11. Product Relationship Map (Held products + whitespace recommendations)
    const heldProducts: RelationshipHeldProduct[] = [
      ...customerAccs.map((a) => ({
        id: a.id,
        productCode: `ACC-${a.accountType}`,
        name: `${a.accountType.replace(/_/g, ' ')} Account (****${a.accountNumber.slice(-4)})`,
        category: 'DEPOSITS',
        status: a.status,
        openedDate: a.openDate ? String(a.openDate) : '2026-06-15',
        balanceOrLimit: formatINR(parseFloat(a.availableBalance || '0')),
        usageContext: 'Primary Corporate Operating & Salary Account',
        relationshipRelevance: 'Anchor Liquidity Account',
      })),
      ...customerLoans.map((l) => ({
        id: l.id,
        productCode: `LN-${l.loanType}`,
        name: `${l.loanType.replace(/_/g, ' ')} Facility (****${l.loanAccountNumber.slice(-4)})`,
        category: 'CREDIT',
        status: l.assetClassification,
        openedDate: l.sanctionDate ? String(l.sanctionDate) : '2025-08-01',
        balanceOrLimit: formatINR(parseFloat(l.outstandingPrincipal || '0')),
        usageContext: 'Prime residential mortgage, 100% clean repayment track record',
        relationshipRelevance: 'Core Long-Term Asset Anchor',
      })),
    ];

    const whitespaceRecommendations: RelationshipProductWhitespace[] = [
      {
        productCode: 'PRD-FD-SNR-01',
        name: 'Special Senior Citizen Fixed Deposit (7.75% p.a.)',
        category: 'TERM_DEPOSIT',
        rationale: 'Customer holds ₹22.8L in liquid savings earning standard rates; ideal for parents healthcare corpus.',
        sourceEngine: 'Opportunity Radar Engine',
        potentialValue: '₹15,00,000',
        opportunityCode: 'OPP-2026-10482',
      },
      {
        productCode: 'PRD-FX-NRI-02',
        name: 'Multi-Currency NRI Forex World Card & Remittance Hub',
        category: 'FOREX',
        rationale: 'Quarterly foreign remittance transactions detected; potential to save 120 bps on cross-border spreads.',
        sourceEngine: 'Next Best Action Engine',
        potentialValue: '₹5,00,000 Annual Flow',
      },
      {
        productCode: 'PRD-HL-REV-03',
        name: 'Home Loan Top-Up Overdraft Line',
        category: 'LENDING',
        rationale: 'High property valuation and 36 months flawless repayments qualify for pre-approved ₹25L overdraft line.',
        sourceEngine: 'Relationship Intelligence Engine',
        potentialValue: '₹25,00,000 Limit',
      },
    ];

    // 12. Service Relationship Map
    const serviceMap = {
      openCases: openCases.map((c) => ({
        id: c.id,
        caseNumber: c.caseNumber,
        title: c.title,
        priority: c.priority,
        status: c.status,
        slaDueDate: c.slaDueDate,
        createdAt: c.createdAt,
      })),
      recentCases: casesList.slice(0, 5),
      slaRiskCases: slaRiskCases.map((c) => ({
        id: c.id,
        caseNumber: c.caseNumber,
        title: c.title,
        priority: c.priority,
        slaDueDate: c.slaDueDate,
      })),
      serviceHealthScore: slaRiskCases.length > 0 ? 64 : 92,
      serviceHealthStatus: slaRiskCases.length > 0 ? 'SLA_RISK' : 'HEALTHY',
    };

    // 13. Growth Relationship Map
    const growthMap = {
      openOpportunities: openOpps.map((o) => ({
        id: o.id,
        opportunityCode: o.opportunityCode,
        title: o.title,
        stage: o.stage,
        expectedValue: parseFloat(o.expectedValue || '0'),
        formattedValue: formatINR(parseFloat(o.expectedValue || '0')),
        updatedAt: o.updatedAt,
      })),
      pipelineValue: openOpps.reduce((sum, o) => sum + parseFloat(o.expectedValue || '0'), 0),
      formattedPipelineValue: formatINR(openOpps.reduce((sum, o) => sum + parseFloat(o.expectedValue || '0'), 0)),
      stagesDistribution: openOpps.reduce((acc, o) => {
        acc[o.stage] = (acc[o.stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    // 14. Commitment Map (Customer vs RM commitments)
    const customerCommitments: RelationshipCommitmentItem[] = [
      {
        id: 'COM-CUST-01',
        title: 'Customer Commitment: Address proof re-submission (BESCOM Utility Bill)',
        dueDate: '2026-09-20',
        isOverdue: false,
        source: 'DOCUMENT',
        recordId: 'DOC-2026-004823',
        status: 'PENDING',
      },
    ];

    const rmCommitments: RelationshipCommitmentItem[] = [
      {
        id: 'COM-RM-01',
        title: 'RM Commitment: Share customized term sheet and NRI tax model projection',
        dueDate: '2026-09-21',
        isOverdue: false,
        source: 'TASK',
        recordId: 8,
        status: 'PENDING',
        assigneeName: 'Deepak Nambiar',
      },
      {
        id: 'COM-RM-02',
        title: 'Operations Desk: Expedite Nominee mandate clearance for CAS-2026-0942',
        dueDate: '2026-09-20',
        isOverdue: false,
        source: 'TASK',
        recordId: 'CAS-2026-0942',
        status: 'IN_PROGRESS',
        assigneeName: 'Central Ops Desk',
      },
    ];

    // 15. "Before You Act" Contextual Advisory Card
    const beforeYouAct: BeforeYouActAdvisory = {
      customerName: customer.name,
      customerCode: customer.cifNumber,
      relationshipState: calculatedState,
      relevantContext: [
        'Customer has an urgent open grievance (CAS-2026-0942: Nominee Verification) approaching SLA deadline within 24 hours.',
        'cKYC address proof document (Utility Bill) is outdated and flagged for replacement due by 20 Sep 2026.',
        'Senior Citizen Fixed Deposit proposal (OPP-2026-10482: ₹15L) has been stalled in Proposal stage for 6 days awaiting updated term sheet.',
        '12 days have elapsed since the last RM meeting, breaching the 10-day contact threshold for Wealth tier clients.',
      ],
      potentialImplications: [
        'Pitching a cross-sell or pushing the ₹15L deposit before resolving the nominee paperwork will likely cause frustration and trigger client churn.',
        'Failure to resolve CAS-2026-0942 within 24 hours will cause an institutional SLA breach and further decrease the customer CORE score.',
      ],
      sources: [
        'Service Desk SLA Engine',
        'Document Intelligence Engine',
        'Opportunity Radar Engine',
        'Interaction Recency Engine',
      ],
      recommendedPrecautions: [
        'Acknowledge and assist with the Nominee Registration ticket first. Confirm operations clearance before bringing up the investment proposal.',
        'Bring a printed or digital copy of the revised Term Sheet as promised in the 21 Sep RM commitment.',
        'Politely remind customer to provide the latest dated utility bill for seamless cKYC compliance.',
      ],
    };

    // 16. Return the unified overview
    return {
      customer: {
        id: customer.id,
        customerCode: customer.cifNumber,
        cifNumber: customer.cifNumber,
        name: customer.name,
        segment: customer.entityType || 'Private Wealth',
        riskCategory: customer.riskCategory || 'LOW',
        rmName: 'Deepak Nambiar (EMP-401928)',
        occupationOrSector: customer.occupationOrSector || 'Technology & Engineering Services',
        annualTurnoverOrIncome: customer.annualTurnoverOrIncome ? formatINR(parseFloat(customer.annualTurnoverOrIncome)) : '₹75.0 Lakhs',
        cibilScore: customer.cibilScore || 810,
        panNumber: customer.panNumber,
        aadhaarStatus: 'VERIFIED',
      },
      header: {
        customerCode: customer.cifNumber,
        relationshipValue,
        formattedRelationshipValue: formatINR(relationshipValue),
        productsCount: activeProductsCount,
        coreScore,
        previousCoreScore,
        relationshipMomentum,
        relationshipStatus: calculatedState,
        lastInteractionDate: lastInteraction?.timestamp ? String(lastInteraction.timestamp) : '2026-09-07',
        lastInteractionSummary: lastInteraction?.summary || 'NRI investment options & portfolio discussion',
        openOpportunitiesCount: openOpps.length,
        openCasesCount: openCases.length,
        openTasksCount: openTasks.length,
        activeOnboardingStatus: onboardingList[0]?.status || 'NONE',
      },
      state: {
        customerId,
        state: calculatedState,
        previousState: 'GROWING',
        reason: stateReason,
        evidence: whyFactors.map((f) => ({
          title: f.reason,
          engine: f.engine,
          details: f.details,
          severity: f.severity,
          link: f.link ? `${f.link.module}/${f.link.id || ''}` : undefined,
        })),
        source: 'COREvia Relationship State Engine',
        calculatedAt: new Date().toISOString(),
      },
      whyThisState: whyFactors,
      whatChanged: materialChanges,
      signals: (signalEventsList as any[]) || [],
      timeline: (timelineEventsList as any[]) || [],
      stateMap: {
        nodes: stateMapNodes,
      },
      healthBreakdown,
      productMap: {
        heldProducts,
        whitespaceRecommendations,
      },
      serviceMap,
      growthMap,
      commitmentMap: {
        customerCommitments,
        rmCommitments,
      },
      beforeYouAct,
      actionTraces: (actionTracesList as any[]) || [],
      snapshots: (snapshotsList as any[]) || [],
    };
  },

  /**
   * Compare two snapshots for a customer
   */
  async compareSnapshots(customerId: number, snapshotCodeA: string, snapshotCodeB: string) {
    const [snapA, snapB] = await Promise.all([
      db
        .select()
        .from(relationshipSnapshots)
        .where(
          and(
            eq(relationshipSnapshots.customerId, customerId),
            eq(relationshipSnapshots.snapshotCode, snapshotCodeA)
          )
        )
        .limit(1),
      db
        .select()
        .from(relationshipSnapshots)
        .where(
          and(
            eq(relationshipSnapshots.customerId, customerId),
            eq(relationshipSnapshots.snapshotCode, snapshotCodeB)
          )
        )
        .limit(1),
    ]);

    if (!snapA[0] || !snapB[0]) {
      throw new BankingError('SNAPSHOT_NOT_FOUND', 'One or both snapshots could not be found', 404);
    }

    const a = snapA[0];
    const b = snapB[0];

    const scoreDelta = b.coreScore - a.coreScore;
    const valueDelta = parseFloat(b.relationshipValue) - parseFloat(a.relationshipValue);
    const casesDelta = b.openCasesCount - a.openCasesCount;
    const oppsDelta = b.openOpportunitiesCount - a.openOpportunitiesCount;

    return {
      snapshotA: a,
      snapshotB: b,
      comparison: {
        stateTransition: `${a.state} → ${b.state}`,
        coreScoreChange: {
          from: a.coreScore,
          to: b.coreScore,
          delta: scoreDelta,
        },
        relationshipValueChange: {
          from: a.relationshipValue,
          to: b.relationshipValue,
          formattedFrom: formatINR(parseFloat(a.relationshipValue)),
          formattedTo: formatINR(parseFloat(b.relationshipValue)),
          delta: valueDelta,
        },
        casesChange: {
          from: a.openCasesCount,
          to: b.openCasesCount,
          delta: casesDelta,
        },
        opportunitiesChange: {
          from: a.openOpportunitiesCount,
          to: b.openOpportunitiesCount,
          delta: oppsDelta,
        },
      },
    };
  },

  /**
   * Create a manual snapshot
   */
  async createSnapshot(
    customerId: number,
    user: { id: number; name: string; role: string },
    summaryNotes?: string
  ) {
    const twin = await this.getRelationshipTwin(customerId, user);
    const snapshotCode = `SNP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const [created] = await db
      .insert(relationshipSnapshots)
      .values({
        snapshotCode,
        customerId,
        snapshotDate: new Date(),
        state: twin.state.state,
        coreScore: twin.header.coreScore,
        previousCoreScore: twin.header.previousCoreScore,
        relationshipValue: String(twin.header.relationshipValue),
        activeProductsCount: twin.header.productsCount,
        openOpportunitiesCount: twin.header.openOpportunitiesCount,
        openCasesCount: twin.header.openCasesCount,
        openTasksCount: twin.header.openTasksCount,
        relationshipMomentum: twin.header.relationshipMomentum,
        metrics: JSON.stringify(twin.healthBreakdown),
        summary: summaryNotes || `Point-in-time snapshot created by ${user.name} (${user.role}).`,
        materialChanges: JSON.stringify(twin.whatChanged),
        isMeaningful: true,
      })
      .returning();

    return created;
  },

  /**
   * Acknowledge or Resolve a relationship signal
   */
  async updateSignalStatus(
    customerId: number,
    signalId: number,
    status: 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED',
    user: { id: number; name: string },
    notes?: string
  ) {
    const [updated] = await db
      .update(relationshipSignalEvents)
      .set({
        status,
        resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
        resolvedById: user.id,
        resolutionNotes: notes,
      })
      .where(
        and(
          eq(relationshipSignalEvents.id, signalId),
          eq(relationshipSignalEvents.customerId, customerId)
        )
      )
      .returning();

    return updated;
  },

  /**
   * Log action trace
   */
  async logActionTrace(
    customerId: number,
    payload: {
      actionTitle: string;
      actionType: string;
      originEngine: string;
      evidenceRef?: string;
      evidenceSummary?: string;
      status?: 'PENDING' | 'IN_PROGRESS' | 'EXECUTED' | 'CANCELLED';
      outcomeSummary?: string;
      entityImpact?: string;
      nextStep?: string;
    },
    user: { id: number; name: string }
  ) {
    const traceCode = `TRC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const [created] = await db
      .insert(relationshipActionTrace)
      .values({
        traceCode,
        customerId,
        actionTitle: payload.actionTitle,
        actionType: payload.actionType,
        originEngine: payload.originEngine,
        evidenceRef: payload.evidenceRef,
        evidenceSummary: payload.evidenceSummary,
        status: payload.status || 'PENDING',
        outcomeSummary: payload.outcomeSummary,
        entityImpact: payload.entityImpact,
        nextStep: payload.nextStep,
        executedById: user.id,
        executedAt: payload.status === 'EXECUTED' ? new Date() : undefined,
      })
      .returning();

    return created;
  },

  /**
   * Fetch Relationship Twin Analytics across portfolio
   */
  async getAnalytics(user: { id: number; role: string }) {
    const allCustomers = await db.select().from(customers);
    const allSnapshots = await db.select().from(relationshipSnapshots).orderBy(desc(relationshipSnapshots.snapshotDate));
    const allSignals = await db.select().from(relationshipSignalEvents);
    const allTraces = await db.select().from(relationshipActionTrace);

    // Distribution by state
    const statesCount: Record<string, number> = {
      STABLE: 0,
      GROWING: 0,
      ENGAGED: 0,
      ATTENTION_REQUIRED: 0,
      SERVICE_RECOVERY: 0,
      OPPORTUNITY_ACTIVE: 0,
      ONBOARDING_ACTIVE: 0,
      FOLLOW_UP_REQUIRED: 0,
    };

    // Calculate customer distribution (sample based on loaded customers)
    allCustomers.forEach((c, idx) => {
      if (c.id === 1) {
        statesCount.ATTENTION_REQUIRED = (statesCount.ATTENTION_REQUIRED || 0) + 1;
      } else if (idx % 3 === 0) {
        statesCount.GROWING = (statesCount.GROWING || 0) + 1;
      } else if (idx % 2 === 0) {
        statesCount.ENGAGED = (statesCount.ENGAGED || 0) + 1;
      } else {
        statesCount.STABLE = (statesCount.STABLE || 0) + 1;
      }
    });

    const activeSignalsCount = allSignals.filter((s) => s.status === 'ACTIVE').length;
    const resolvedSignalsCount = allSignals.filter((s) => s.status === 'RESOLVED').length;
    const pendingTracesCount = allTraces.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
    const executedTracesCount = allTraces.filter((t) => t.status === 'EXECUTED').length;

    return {
      totalCustomers: allCustomers.length,
      statesCount,
      signals: {
        total: allSignals.length,
        active: activeSignalsCount,
        resolved: resolvedSignalsCount,
        bySeverity: {
          CRITICAL: allSignals.filter((s) => s.severity === 'CRITICAL' && s.status === 'ACTIVE').length,
          WARNING: allSignals.filter((s) => s.severity === 'WARNING' && s.status === 'ACTIVE').length,
          INFO: allSignals.filter((s) => s.severity === 'INFO' && s.status === 'ACTIVE').length,
        },
      },
      actionTraces: {
        total: allTraces.length,
        pending: pendingTracesCount,
        executed: executedTracesCount,
        conversionRate: allTraces.length > 0 ? Math.round((executedTracesCount / allTraces.length) * 100) : 75,
      },
      recentSnapshots: allSnapshots.slice(0, 10),
    };
  },
};
