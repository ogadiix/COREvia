import { db } from './index.ts';
import {
  relationshipEvents,
  relationshipStateHistory,
  relationshipSnapshots,
  relationshipSignalEvents,
  relationshipActionTrace,
  customers,
  customerScores,
  customerScoreHistory,
  serviceCases,
  opportunities,
  tasks,
  documents,
  users,
} from './schema.ts';
import { eq, sql } from 'drizzle-orm';

export async function seedRelationshipTwinData() {
  console.log('Seeding Phase 26 Relationship Digital Twin data...');

  // 1. Verify customer Rahul Sharma (CUS-10482, ID 1) exists
  const [rahul] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, 1))
    .limit(1);

  if (!rahul) {
    console.log('Customer 1 (Rahul Sharma) not found. Skipping digital twin seeding.');
    return;
  }

  // 2. Ensure CORE Score reflects 84 (declined from 86)
  const existingScores = await db
    .select()
    .from(customerScores)
    .where(eq(customerScores.customerId, 1))
    .limit(1);

  if (existingScores.length > 0) {
    await db
      .update(customerScores)
      .set({
        coreScore: 84,
        financialHealthScore: 88,
        creditRiskScore: 82,
        engagementScore: 78,
      })
      .where(eq(customerScores.customerId, 1));
  } else {
    await db.insert(customerScores).values({
      customerId: 1,
      coreScore: 84,
      financialHealthScore: 88,
      creditRiskScore: 82,
      engagementScore: 78,
      churnProbability: '0.12',
      calculationDate: '2026-09-17',
      factors: JSON.stringify([
        { factor: 'Service Case SLA Risk', impact: -2, category: 'SERVICE' },
        { factor: 'Delayed RM Interaction Recency', impact: -1, category: 'ENGAGEMENT' },
        { factor: 'High Net Worth Stability', impact: +4, category: 'FINANCIAL' },
      ]),
    });
  }

  // Ensure score history records the drop from 86 -> 84
  const historyRecords = await db
    .select()
    .from(customerScoreHistory)
    .where(eq(customerScoreHistory.customerId, 1));

  if (historyRecords.length < 2) {
    await db.insert(customerScoreHistory).values([
      {
        customerId: 1,
        coreScore: 86,
        financialHealthScore: 90,
        creditRiskScore: 84,
        engagementScore: 86,
        recordedDate: '2026-09-08',
        factors: JSON.stringify([{ factor: 'Strong Portfolio Growth', impact: +3 }]),
      },
      {
        customerId: 1,
        coreScore: 84,
        financialHealthScore: 88,
        creditRiskScore: 82,
        engagementScore: 78,
        recordedDate: '2026-09-17',
        factors: JSON.stringify([{ factor: 'Open Grievance & SLA Proximity', impact: -2 }]),
      },
    ]);
  }

  // 3. Ensure open service case approaching SLA exists: CAS-2026-0942
  const existingCases = await db
    .select()
    .from(serviceCases)
    .where(eq(serviceCases.caseNumber, 'CAS-2026-0942'));

  if (existingCases.length === 0) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 30, 0, 0);

    const rmUser = (await db.select().from(users).limit(1))[0];

    await db.insert(serviceCases).values({
      caseNumber: 'CAS-2026-0942',
      customerId: 1,
      title: 'NetBanking NRI Nominee Form & Standing Instruction Verification',
      description:
        'Customer submitted physical NRI nominee registration and mutual fund standing instruction mandate. Verification pending from NRI branch desk. Approaching regulatory SLA.',
      category: 'NETBANKING',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      slaDueDate: tomorrow,
      assignedToId: rmUser?.id,
    });
  }

  // 4. Ensure customer commitment task for Address Proof exists
  const existingCommitment = await db
    .select()
    .from(tasks)
    .where(eq(tasks.title, 'Customer Commitment: Address proof re-submission (BESCOM Utility Bill)'));

  if (existingCommitment.length === 0) {
    const rmUser = (await db.select().from(users).limit(1))[0];
    await db.insert(tasks).values({
      customerId: 1,
      title: 'Customer Commitment: Address proof re-submission (BESCOM Utility Bill)',
      description:
        'Customer promised to email or upload latest dated utility bill (within last 60 days) to replace expired bill DOC-2026-004823.',
      priority: 'HIGH',
      status: 'PENDING',
      dueDate: '2026-09-20',
      assignedToId: rmUser?.id,
      relatedType: 'CUSTOMER',
      relatedId: '1',
    });
  }

  // 5. Ensure existing document DOC-2026-004823 is flagged with replacement required
  await db
    .update(documents)
    .set({
      status: 'REPLACEMENT_REQUIRED',
      reviewStatus: 'REPLACEMENT_REQUESTED',
      replacementRequired: true,
      replacementDueDate: '2026-09-20',
      replacementReason: 'Electricity bill statement date exceeds 90-day RBI cKYC regulatory validity threshold.',
    })
    .where(eq(documents.documentCode, 'DOC-2026-004823'));

  // 6. Check if digital twin events are already seeded
  const existingEventsCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(relationshipEvents)
    .where(eq(relationshipEvents.customerId, 1));

  if ((existingEventsCount[0]?.count || 0) >= 10) {
    console.log('Relationship Twin events already seeded for customer 1.');
    return;
  }

  // 7. Seed comprehensive normalized Relationship Events
  const eventsToInsert = [
    {
      eventId: 'REV-2026-10482-01',
      customerId: 1,
      eventType: 'ACCOUNT_CREATED',
      sourceEntity: 'ACCOUNT',
      sourceId: '10420100089104',
      timestamp: new Date('2026-06-15T09:30:00Z'),
      title: 'Salary & Savings Super Account Activated',
      description: 'Primary corporate salary savings account ****9104 opened with ₹5,00,000 initial liquidity.',
      importance: 'HIGH' as const,
      metadata: JSON.stringify({ initialDeposit: 500000, scheme: 'PREMIUM_SAVINGS' }),
    },
    {
      eventId: 'REV-2026-10482-02',
      customerId: 1,
      eventType: 'PRODUCT_ADDED',
      sourceEntity: 'PRODUCT',
      sourceId: 'PRD-DEBIT-001',
      timestamp: new Date('2026-06-20T11:00:00Z'),
      title: 'COREvia Infinite Metal Debit Card Issued',
      description: 'High-limit international contact-less card enrolled and PIN delivered securely.',
      importance: 'MEDIUM' as const,
    },
    {
      eventId: 'REV-2026-10482-03',
      customerId: 1,
      eventType: 'ACCOUNT_CREATED',
      sourceEntity: 'ACCOUNT',
      sourceId: '10420100089105',
      timestamp: new Date('2026-07-10T14:15:00Z'),
      title: 'Tax-Saver Term Deposit Opened (₹10,00,000)',
      description: '3-year fixed deposit booked at 7.25% p.a. with quarterly interest payout option.',
      importance: 'HIGH' as const,
      metadata: JSON.stringify({ principal: 1000000, tenureMonths: 36, rate: 7.25 }),
    },
    {
      eventId: 'REV-2026-10482-04',
      customerId: 1,
      eventType: 'LOAN_UPDATED',
      sourceEntity: 'LOAN',
      sourceId: 'LN-2026-10482',
      timestamp: new Date('2026-08-01T10:00:00Z'),
      title: 'Home Loan Facility Annual Reset & Rate Revision',
      description: 'Home loan benchmark repo-linked rate reviewed; zero defaults across 36 trailing months.',
      importance: 'MEDIUM' as const,
    },
    {
      eventId: 'REV-2026-10482-05',
      customerId: 1,
      eventType: 'REVIEW_COMPLETED',
      sourceEntity: 'REVIEW',
      sourceId: 'REV-2026-Q2-01',
      timestamp: new Date('2026-08-20T16:00:00Z'),
      title: 'Annual HNW Relationship Review Completed',
      description: 'Portfolio assessed by Senior RM. Customer classified as High Growth Tier 1. CORE Score calibrated to 86.',
      importance: 'HIGH' as const,
      metadata: JSON.stringify({ coreScore: 86, reviewerRole: 'RELATIONSHIP_MANAGER' }),
    },
    {
      eventId: 'REV-2026-10482-06',
      customerId: 1,
      eventType: 'OPPORTUNITY_CREATED',
      sourceEntity: 'OPPORTUNITY',
      sourceId: 'OPP-2026-10482',
      timestamp: new Date('2026-08-30T10:30:00Z'),
      title: 'Opportunity Created: Special Senior Citizen FD & NRI Advisory',
      description: 'Identified ₹15,00,000 liquidity deployment for parents’ healthcare fund and NRI offshore vehicle.',
      importance: 'HIGH' as const,
      metadata: JSON.stringify({ expectedValue: 1500000, stage: 'QUALIFICATION' }),
    },
    {
      eventId: 'REV-2026-10482-07',
      customerId: 1,
      eventType: 'INTERACTION_CREATED',
      sourceEntity: 'INTERACTION',
      sourceId: 'INT-2026-000481',
      timestamp: new Date('2026-09-07T11:45:00Z'),
      title: 'RM Meeting: NRI Tax-Harvesting & Term Sheet Presentation',
      description: 'In-person meeting at Mumbai branch. Customer requested customized tax-yield calculation before proceeding.',
      importance: 'MEDIUM' as const,
      metadata: JSON.stringify({ channel: 'BRANCH_VISIT', sentiment: 'POSITIVE' }),
    },
    {
      eventId: 'REV-2026-10482-08',
      customerId: 1,
      eventType: 'OPPORTUNITY_UPDATED',
      sourceEntity: 'OPPORTUNITY',
      sourceId: 'OPP-2026-10482',
      timestamp: new Date('2026-09-09T06:24:27Z'),
      title: 'Opportunity Advanced to Proposal Stage',
      description: 'Formal proposal shared. Deal stalled with no status change in trailing 10 days.',
      importance: 'HIGH' as const,
      metadata: JSON.stringify({ stage: 'PROPOSAL', daysStalled: 10 }),
    },
    {
      eventId: 'REV-2026-10482-09',
      customerId: 1,
      eventType: 'DOCUMENT_UPDATED',
      sourceEntity: 'DOCUMENT',
      sourceId: 'DOC-2026-004823',
      timestamp: new Date('2026-09-12T15:00:00Z'),
      title: 'Document Replacement Required: Utility Bill',
      description: 'cKYC engine flagged submitted utility bill as > 90 days old. Replacement requested due 20 Sep 2026.',
      importance: 'MEDIUM' as const,
      metadata: JSON.stringify({ replacementDueDate: '2026-09-20', docType: 'Utility Bill' }),
    },
    {
      eventId: 'REV-2026-10482-10',
      customerId: 1,
      eventType: 'CASE_CREATED',
      sourceEntity: 'SERVICE_CASE',
      sourceId: 'CAS-2026-0942',
      timestamp: new Date('2026-09-16T10:15:00Z'),
      title: 'Service Case Logged: NetBanking Nominee & Mandate Desk',
      description: 'Customer raised high-priority request for urgent NRI nominee linkage across all CASA accounts.',
      importance: 'HIGH' as const,
      metadata: JSON.stringify({ priority: 'HIGH', status: 'IN_PROGRESS' }),
    },
    {
      eventId: 'REV-2026-10482-11',
      customerId: 1,
      eventType: 'CORE_SCORE_CHANGED',
      sourceEntity: 'CORE_SCORE',
      sourceId: 'SCR-2026-0917',
      timestamp: new Date('2026-09-17T18:00:00Z'),
      title: 'CORE Score Adjusted: 86 → 84 (-2 pts)',
      description: 'Automated daily calibration penalized score due to open high-priority service ticket and interaction inactivity (>10 days).',
      importance: 'HIGH' as const,
      metadata: JSON.stringify({ oldScore: 86, newScore: 84, delta: -2 }),
    },
    {
      eventId: 'REV-2026-10482-12',
      customerId: 1,
      eventType: 'CASE_ESCALATED',
      sourceEntity: 'SERVICE_CASE',
      sourceId: 'CAS-2026-0942',
      timestamp: new Date('2026-09-18T09:00:00Z'),
      title: 'SLA Risk Alert: Nominee Case Approaching Deadline (<24h)',
      description: 'Case has less than 24 hours remaining before institutional regulatory SLA breach.',
      importance: 'CRITICAL' as const,
    },
    {
      eventId: 'REV-2026-10482-13',
      customerId: 1,
      eventType: 'NBA_CREATED',
      sourceEntity: 'NBA',
      sourceId: 'NBA-2026-10482-01',
      timestamp: new Date('2026-09-19T08:30:00Z'),
      title: 'Next Best Action: Acknowledge Nominee Desk & Dispatch Term Sheet',
      description: 'Dual-purpose engagement recommended: expedite service case resolution first, then follow up on stalled ₹15L opportunity.',
      importance: 'HIGH' as const,
    },
  ];

  await db.insert(relationshipEvents).values(eventsToInsert);

  // 8. Seed Relationship State History
  await db.insert(relationshipStateHistory).values([
    {
      customerId: 1,
      state: 'STABLE',
      previousState: 'ENGAGED',
      reason: 'Regular salary credits, healthy liquidity, active deposit accounts, and satisfied service reviews.',
      evidence: JSON.stringify([
        {
          title: 'Healthy CASA Balances',
          engine: 'Financial Relationship Engine',
          metric: '₹22,80,000 Liquid',
          severity: 'POSITIVE',
        },
        {
          title: 'Zero Overdue Credit',
          engine: 'Lending Portfolio Engine',
          metric: '100% On-Time Repayments',
          severity: 'POSITIVE',
        },
      ]),
      source: 'COREvia Relationship State Engine',
      calculatedAt: new Date('2026-08-20T16:00:00Z'),
    },
    {
      customerId: 1,
      state: 'GROWING',
      previousState: 'STABLE',
      reason: 'Opportunity OPP-2026-10482 created for ₹15,00,000 senior citizen deposit deployment.',
      evidence: JSON.stringify([
        {
          title: 'High-Value Opportunity Active',
          engine: 'Opportunity Radar Engine',
          metric: '₹15,00,000 Pipeline',
          severity: 'POSITIVE',
        },
      ]),
      source: 'COREvia Relationship State Engine',
      calculatedAt: new Date('2026-09-01T10:00:00Z'),
    },
    {
      customerId: 1,
      state: 'ATTENTION_REQUIRED',
      previousState: 'GROWING',
      reason:
        'Service case CAS-2026-0942 approaching SLA deadline (<24h), CORE score decreased 86 → 84, opportunity stalled at Proposal stage for 6 days, and utility bill document requires replacement.',
      evidence: JSON.stringify([
        {
          title: 'Service Case Approaching SLA Deadline',
          engine: 'Service Desk Engine',
          metric: 'CAS-2026-0942 (Due in < 24 hrs)',
          entityType: 'SERVICE_CASE',
          entityId: 'CAS-2026-0942',
          link: '/service-desk',
          details: 'Physical NRI nominee verification pending with operations desk.',
          severity: 'CRITICAL',
        },
        {
          title: 'CORE Score Calibration Declined',
          engine: 'CORE Score Engine v3.2',
          metric: '86 → 84 (-2 pts)',
          entityType: 'CORE_SCORE',
          entityId: '1',
          details: 'Penalty triggered by inactive relationship recency and unaddressed service ticket.',
          severity: 'WARNING',
        },
        {
          title: 'Opportunity Stalled in Proposal Stage',
          engine: 'Opportunity Radar Engine',
          metric: 'OPP-2026-10482 (6 days inactive)',
          entityType: 'OPPORTUNITY',
          entityId: 'OPP-2026-10482',
          link: '/opportunities',
          details: 'No outreach or note logged since proposal stage advancement.',
          severity: 'WARNING',
        },
        {
          title: 'KYC Address Proof Replacement Required',
          engine: 'Document Intelligence Engine',
          metric: 'DOC-2026-004823 (Due 20 Sep 2026)',
          entityType: 'DOCUMENT',
          entityId: 'DOC-2026-004823',
          link: '/documents',
          details: 'Outdated utility bill rejected; replacement pending from customer.',
          severity: 'WARNING',
        },
        {
          title: 'No RM Interaction in 12 Days',
          engine: 'Interaction & Recency Engine',
          metric: 'Last meeting: 07 Sep 2026 (12d ago)',
          entityType: 'INTERACTION',
          entityId: 'INT-2026-000481',
          link: '/interactions',
          details: 'Exceeds institutional 10-day contact threshold for HNW wealth customers.',
          severity: 'INFO',
        },
      ]),
      source: 'COREvia Relationship State Engine',
      calculatedAt: new Date(),
    },
  ]);

  // 9. Seed Relationship Snapshots for Historical Comparisons & Replay
  await db.insert(relationshipSnapshots).values([
    {
      snapshotCode: 'SNP-2026-0820-001',
      customerId: 1,
      snapshotDate: new Date('2026-08-20T00:00:00Z'),
      state: 'STABLE',
      coreScore: 86,
      previousCoreScore: 85,
      relationshipValue: '4280000.00',
      activeProductsCount: 6,
      openOpportunitiesCount: 0,
      openCasesCount: 0,
      openTasksCount: 1,
      relationshipMomentum: 'STABLE',
      metrics: JSON.stringify({
        coreScore: 86,
        relationshipMomentum: 'STABLE',
        engagementScore: 88,
        productDepthScore: 90,
        serviceHealthScore: 95,
        opportunityScore: 50,
        taskCompletionScore: 92,
      }),
      summary: 'Q2 Relationship Review successfully closed. Strong deposit retention and steady mortgage amortization.',
      materialChanges: JSON.stringify([
        {
          category: 'CORE_SCORE',
          changeType: 'IMPROVED',
          title: 'CORE Score increased to 86',
          oldValue: 85,
          newValue: 86,
          severity: 'POSITIVE',
          evidence: 'Positive credit bureau refresh and consistent monthly inflows.',
        },
      ]),
      isMeaningful: true,
    },
    {
      snapshotCode: 'SNP-2026-0912-001',
      customerId: 1,
      snapshotDate: new Date('2026-09-12T00:00:00Z'),
      state: 'GROWING',
      coreScore: 86,
      previousCoreScore: 86,
      relationshipValue: '4280000.00',
      activeProductsCount: 6,
      openOpportunitiesCount: 1,
      openCasesCount: 0,
      openTasksCount: 1,
      relationshipMomentum: 'POSITIVE',
      metrics: JSON.stringify({
        coreScore: 86,
        relationshipMomentum: 'POSITIVE',
        engagementScore: 85,
        productDepthScore: 90,
        serviceHealthScore: 90,
        opportunityScore: 82,
        taskCompletionScore: 88,
      }),
      summary: 'Senior Citizen Fixed Deposit Opportunity OPP-2026-10482 active in Proposal stage.',
      materialChanges: JSON.stringify([
        {
          category: 'OPPORTUNITY',
          changeType: 'NEW',
          title: 'Senior Citizen Fixed Deposit opportunity registered (₹15L)',
          oldValue: 'None',
          newValue: 'Proposal Stage',
          severity: 'POSITIVE',
          evidence: 'In-person meeting on 07 Sep 2026.',
        },
      ]),
      isMeaningful: true,
    },
    {
      snapshotCode: 'SNP-2026-0919-001',
      customerId: 1,
      snapshotDate: new Date(),
      state: 'ATTENTION_REQUIRED',
      coreScore: 84,
      previousCoreScore: 86,
      relationshipValue: '4280000.00',
      activeProductsCount: 6,
      openOpportunitiesCount: 1,
      openCasesCount: 1,
      openTasksCount: 2,
      relationshipMomentum: 'DECLINING',
      metrics: JSON.stringify({
        coreScore: 84,
        relationshipMomentum: 'DECLINING',
        engagementScore: 72,
        productDepthScore: 88,
        serviceHealthScore: 64,
        opportunityScore: 70,
        taskCompletionScore: 80,
      }),
      summary: 'State escalated to ATTENTION REQUIRED due to service case approaching SLA, stalled opportunity, and expired address proof.',
      materialChanges: JSON.stringify([
        {
          category: 'SERVICE',
          changeType: 'ESCALATED',
          title: 'High-priority Service Case CAS-2026-0942 approaching SLA (<24 hrs)',
          oldValue: '0 Open Cases',
          newValue: '1 High Priority Case',
          severity: 'CRITICAL',
          evidence: 'NRI Nominee verification pending with operations desk.',
        },
        {
          category: 'CORE_SCORE',
          changeType: 'DECLINED',
          title: 'CORE Score dropped from 86 to 84 (-2 pts)',
          oldValue: 86,
          newValue: 84,
          severity: 'WARNING',
          evidence: 'Penalized by active service ticket and recency inactivity.',
        },
        {
          category: 'OPPORTUNITY',
          changeType: 'CHANGED',
          title: 'Opportunity OPP-2026-10482 stalled at Proposal for 6 days',
          oldValue: 'Active Discussion',
          newValue: 'Stalled (6d)',
          severity: 'WARNING',
          evidence: 'Customer awaiting revised term sheet from RM.',
        },
        {
          category: 'DOCUMENT',
          changeType: 'CHANGED',
          title: 'Utility Bill marked Replacement Required',
          oldValue: 'VERIFIED',
          newValue: 'REPLACEMENT_REQUIRED',
          severity: 'WARNING',
          evidence: 'DOC-2026-004823 statement date > 90 days threshold.',
        },
      ]),
      isMeaningful: true,
    },
  ]);

  // 10. Seed Relationship Signal Events
  await db.insert(relationshipSignalEvents).values([
    {
      signalCode: 'SIG-2026-10482-01',
      customerId: 1,
      signalType: 'SLA_RISK',
      headline: 'Service case CAS-2026-0942 approaching institutional SLA deadline (<24h)',
      severity: 'CRITICAL',
      evidence: JSON.stringify({
        caseNumber: 'CAS-2026-0942',
        title: 'NetBanking NRI Nominee Form & Standing Instruction Verification',
        slaDueInHours: 22,
        priority: 'HIGH',
      }),
      source: 'Service Desk SLA Monitor',
      recommendedAction: 'Coordinate immediately with Central Ops to clear physical mandate before contacting customer.',
      status: 'ACTIVE',
    },
    {
      signalCode: 'SIG-2026-10482-02',
      customerId: 1,
      signalType: 'SCORE_DECLINE',
      headline: 'CORE Score calibrated down by 2 points (86 → 84)',
      severity: 'WARNING',
      evidence: JSON.stringify({
        oldScore: 86,
        newScore: 84,
        delta: -2,
        factors: ['Open High-Priority Grievance', 'Interaction Inactivity'],
      }),
      source: 'CORE Score Engine v3.2',
      recommendedAction: 'Address underlying service grievance to restore score above 85 Tier 1 benchmark.',
      status: 'ACTIVE',
    },
    {
      signalCode: 'SIG-2026-10482-03',
      customerId: 1,
      signalType: 'OPPORTUNITY_STALLED',
      headline: 'Proposal OPP-2026-10482 (₹15.0L) has had no activity for 6 days',
      severity: 'WARNING',
      evidence: JSON.stringify({
        opportunityCode: 'OPP-2026-10482',
        stage: 'PROPOSAL',
        expectedValue: 1500000,
        daysInactive: 6,
      }),
      source: 'Opportunity Radar Engine',
      recommendedAction: 'Share updated NRI term sheet and tax model to unblock customer decision.',
      status: 'ACTIVE',
    },
    {
      signalCode: 'SIG-2026-10482-04',
      customerId: 1,
      signalType: 'DOCUMENT_REPLACEMENT_REQUIRED',
      headline: 'cKYC Address Proof (Utility Bill) requires customer re-submission',
      severity: 'WARNING',
      evidence: JSON.stringify({
        documentCode: 'DOC-2026-004823',
        dueDate: '2026-09-20',
        reason: 'Statement age > 90 days',
      }),
      source: 'Document Intelligence Engine',
      recommendedAction: 'Remind customer of the 20 Sep 2026 commitment during upcoming interaction.',
      status: 'ACTIVE',
    },
    {
      signalCode: 'SIG-2026-10482-05',
      customerId: 1,
      signalType: 'NO_RECENT_CONTACT',
      headline: '12 days since last RM touchpoint (threshold: 10 days for Wealth Segment)',
      severity: 'INFO',
      evidence: JSON.stringify({
        lastInteractionDate: '2026-09-07',
        lastChannel: 'BRANCH_VISIT',
        thresholdDays: 10,
      }),
      source: 'Interaction Recency Tracker',
      recommendedAction: 'Schedule relationship touchpoint by 21 Sep 2026.',
      status: 'ACTIVE',
    },
  ]);

  // 11. Seed Relationship Action Trace
  const rmUser = (await db.select().from(users).limit(1))[0];
  await db.insert(relationshipActionTrace).values([
    {
      traceCode: 'TRC-2026-10482-01',
      customerId: 1,
      actionTitle: 'Expedite Central Ops Nominee Verification for CAS-2026-0942',
      actionType: 'SERVICE_ESCALATION',
      originEngine: 'Service Desk Engine',
      evidenceRef: 'CAS-2026-0942',
      evidenceSummary: 'Regulatory SLA approaching within 24 hours for physical NRI nominee paperwork.',
      status: 'IN_PROGRESS',
      outcomeSummary: 'Escalation ticket dispatched to Central Operations NRI clearing cell.',
      entityImpact: 'Priority elevated to urgent in Service Desk queue.',
      nextStep: 'Confirm approval from NRI ops desk by 14:00 today.',
      executedById: rmUser?.id,
      executedAt: new Date(),
    },
    {
      traceCode: 'TRC-2026-10482-02',
      customerId: 1,
      actionTitle: 'Dispatch Revised Term Sheet & Tax Harvesting Model for OPP-2026-10482',
      actionType: 'NBA_EXECUTION',
      originEngine: 'Next Best Action Engine',
      evidenceRef: 'OPP-2026-10482',
      evidenceSummary: 'Proposal stage idle for 6 days while customer evaluates yield comparison.',
      status: 'PENDING',
      outcomeSummary: 'Awaiting RM trigger after confirming service nominee verification.',
      entityImpact: 'Will unblock customer review for ₹15,00,000 fixed deposit.',
      nextStep: 'Send proposal document link once service grievance is confirmed resolved.',
      executedById: rmUser?.id,
    },
    {
      traceCode: 'TRC-2026-10482-03',
      customerId: 1,
      actionTitle: 'Customer Address Proof Re-submission Commitment Tracking',
      actionType: 'DOCUMENT_REQUEST',
      originEngine: 'Document Intelligence Engine',
      evidenceRef: 'DOC-2026-004823',
      evidenceSummary: 'Electricity bill outdated; customer committed to re-upload by 20 Sep 2026.',
      status: 'PENDING',
      outcomeSummary: 'Notification queued for customer NetBanking portal.',
      entityImpact: 'Maintains cKYC compliant status without adverse regulatory freeze.',
      nextStep: 'Monitor document inbox on 20 Sep 2026.',
      executedById: rmUser?.id,
    },
    {
      traceCode: 'TRC-2026-10482-04',
      customerId: 1,
      actionTitle: 'Annual Portfolio Review & Investment Thesis Discussion',
      actionType: 'RM_FOLLOW_UP',
      originEngine: 'Relationship Intelligence Engine',
      evidenceRef: 'REV-2026-Q2-01',
      evidenceSummary: 'Scheduled annual review conducted in branch.',
      status: 'EXECUTED',
      outcomeSummary: 'Completed successfully on 20 Aug 2026; agreed to explore parental fixed deposit in September.',
      entityImpact: 'Established basis for opportunity OPP-2026-10482 and validated risk profile.',
      nextStep: 'Convert ₹15L opportunity into booking.',
      executedById: rmUser?.id,
      executedAt: new Date('2026-08-20T16:30:00Z'),
    },
  ]);

  console.log('Phase 26 Relationship Digital Twin seed completed successfully!');
}
