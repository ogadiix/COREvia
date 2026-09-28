import { db } from './index.ts';
import { customers, users, decisionTraces, decisionTraceEvidence, decisionTraceSourceNodes } from './schema.ts';
import { eq } from 'drizzle-orm';
import { decisionTraceService } from '../services/decisionTrace.service.ts';

export async function seedDecisionTraces() {
  console.log('--- SEEDING PHASE 29 DECISION TRACE & EXPLAINABILITY DATA ---');

  // Verify canonical customers
  const [rahul] = await db.select().from(customers).where(eq(customers.id, 1)).limit(1);
  const [kalyan] = await db.select().from(customers).where(eq(customers.id, 2)).limit(1);
  const [adminUser] = await db.select().from(users).where(eq(users.role, 'ADMINISTRATOR')).limit(1);

  if (!rahul) {
    console.warn('⚠️ Canonical customer 1 (Rahul Sharma) not found. Skipping Decision Trace seed.');
    return;
  }

  // Check if already seeded
  const existing = await db
    .select({ count: decisionTraces.id })
    .from(decisionTraces)
    .where(eq(decisionTraces.decisionId, 'DT-20260928-00101'))
    .limit(1);

  if (existing.length > 0) {
    console.log('✓ Phase 29 Decision Trace data already seeded. Skipping.');
    return;
  }

  console.log(`Seeding realistic decision traces for customer: ${rahul.name} (ID: ${rahul.id})...`);

  // TRACE 1: Rahul Sharma - CORE Score Decline & Service Friction
  await decisionTraceService.recordDecisionTrace({
    decisionId: 'DT-20260928-00101',
    customerId: rahul.id,
    userId: adminUser?.id,
    sourceModule: 'CORE_SCORE',
    sourceEngine: 'CORE_SCORE',
    decisionType: 'CORE_SCORE_CHANGE',
    decisionStatus: 'PENDING',
    recommendationTitle: 'Schedule Immediate Relationship Review & Service Friction Escalation',
    recommendationSummary:
      'CORE Score declined from 84 to 79 driven by service ticket friction and declining interaction velocity. Relationship momentum requires proactive intervention.',
    decisionMode: 'DETERMINISTIC',
    confidence: null, // Deterministic engine does not fabricate an arbitrary float
    confidenceBasis: 'Rule-based',
    limitations: [
      'This recommendation is based on available CRM transaction, service ticket, and score data.',
      'This does not predict future customer behavior or deposit outflows.',
      'This recommendation requires RM human review before taking customer-facing action.',
    ],
    actionTitle: 'Schedule Comprehensive Relationship Health Review',
    actionType: 'SCHEDULE_RELATIONSHIP_REVIEW',
    actionPayload: {
      suggestedReviewDate: '2026-10-02',
      topics: ['Unresolved Mobile Banking Dispute', 'Fixed Deposit Renewal Options'],
      priority: 'HIGH',
    },
    evidence: [
      {
        evidenceType: 'SCORE_CHANGE',
        sourceEngine: 'CORE_SCORE',
        sourceEntityType: 'CUSTOMER_SCORE',
        sourceEntityId: 'SCORE-10482',
        sourceField: 'coreScore',
        description: 'CORE Score declined 5 points from institutional baseline (84 to 79)',
        observedValue: '79',
        previousValue: '84',
        changeDirection: 'DECREASE',
        contributionType: 'PRIMARY',
        contributionWeight: 'High',
      },
      {
        evidenceType: 'SERVICE_EVENT',
        sourceEngine: 'SERVICE_DESK',
        sourceEntityType: 'SERVICE_CASE',
        sourceEntityId: 'CASE-104',
        sourceField: 'status',
        description: 'High-priority disputed transaction ticket #104 pending resolution for 48 hours',
        observedValue: 'IN_PROGRESS',
        previousValue: 'NEW',
        changeDirection: 'TRIGGERED',
        contributionType: 'PRIMARY',
        contributionWeight: 'Critical',
      },
      {
        evidenceType: 'ACTIVITY_CHANGE',
        sourceEngine: 'RELATIONSHIP_INTELLIGENCE',
        sourceEntityType: 'INTERACTION',
        sourceEntityId: 'INT-SERIES',
        sourceField: 'monthlyInteractions',
        description: 'Client interaction volume dropped 40% over preceding 30 days',
        observedValue: '1 interaction/month',
        previousValue: '4 interactions/month',
        changeDirection: 'DECREASE',
        contributionType: 'SUPPORTING',
        contributionWeight: 'Medium',
      },
      {
        evidenceType: 'OPPORTUNITY_EVENT',
        sourceEngine: 'OPPORTUNITY_RADAR',
        sourceEntityType: 'OPPORTUNITY',
        sourceEntityId: 'OP-10482',
        sourceField: 'lastActivityDate',
        description: 'Fixed Deposit renewal deal inactive with no officer update in 14 days',
        observedValue: '14 days inactive',
        previousValue: 'Active',
        changeDirection: 'DECREASE',
        contributionType: 'SUPPORTING',
        contributionWeight: 'Medium',
      },
    ],
    sourceChain: [
      {
        orderIndex: 0,
        sourceType: 'CUSTOMER',
        sourceId: 'CUS-10482',
        sourceEngine: 'CORE_REGISTRY',
        description: 'Customer master record and KYC profile verified',
      },
      {
        orderIndex: 1,
        sourceType: 'ACCOUNT',
        sourceId: '10420100089104',
        sourceEngine: 'CASA_LEDGER',
        description: 'Primary Premium Savings Account balance verified',
      },
      {
        orderIndex: 2,
        sourceType: 'SERVICE_CASE',
        sourceId: 'CASE-104',
        sourceEngine: 'SERVICE_DESK',
        description: 'Service dispute ticket created by client via digital banking',
      },
      {
        orderIndex: 3,
        sourceType: 'SCORE',
        sourceId: 'SCORE-10482',
        sourceEngine: 'CORE_SCORE',
        description: 'Deterministic scoring algorithm recalculated score based on activity and friction',
      },
      {
        orderIndex: 4,
        sourceType: 'RECOMMENDATION',
        sourceId: 'REC-10482-01',
        sourceEngine: 'RELATIONSHIP_INTELLIGENCE',
        description: 'Decision trace synthesized to recommend proactive relationship intervention',
      },
    ],
  });

  // TRACE 2: Rahul Sharma - Next Best Action: Wealth Advisory & Senior Citizen FD Cross-Sell
  await decisionTraceService.recordDecisionTrace({
    decisionId: 'DT-20260928-00102',
    customerId: rahul.id,
    userId: adminUser?.id,
    sourceModule: 'NEXT_BEST_ACTION',
    sourceEngine: 'NEXT_BEST_ACTION',
    decisionType: 'NEXT_BEST_ACTION',
    decisionStatus: 'CONFIRMED',
    recommendationTitle: 'Senior Citizen Special Fixed Deposit Allocation for Parents',
    recommendationSummary:
      'Customer maintains idle CASA liquidity above ₹25,00,000 while household registry confirms dependent senior citizen parents eligible for preferential 7.85% deposit rates.',
    decisionMode: 'HYBRID',
    confidence: '88%',
    confidenceBasis: 'Deterministic evidence + AI-generated explanation',
    limitations: [
      'This recommendation is based on customer account balances and declared household demographics.',
      'Does not constitute a formal investment advisory mandate or binding financial commitment.',
      'Customer suitability and tax deduction status under section 80TTB must be re-verified.',
    ],
    actionTitle: 'Send Senior Citizen Fixed Deposit Proposal via RM Desk',
    actionType: 'DISPATCH_PROPOSAL',
    actionPayload: {
      proposedAmount: 1500000,
      tenorMonths: 36,
      interestRate: 7.85,
      interestPayout: 'QUARTERLY',
    },
    evidence: [
      {
        evidenceType: 'CUSTOMER_FACT',
        sourceEngine: 'RELATIONSHIP_GRAPH',
        sourceEntityType: 'HOUSEHOLD',
        sourceEntityId: 'HH-10482',
        sourceField: 'memberRelation',
        description: 'Verified household connection to dependent parents (Age > 60)',
        observedValue: '2 Senior Citizen Members',
        previousValue: null,
        changeDirection: 'STABLE',
        contributionType: 'PRIMARY',
        contributionWeight: 'High',
      },
      {
        evidenceType: 'PRODUCT_EVENT',
        sourceEngine: 'ACCOUNTS',
        sourceEntityType: 'ACCOUNT',
        sourceEntityId: '10420100089104',
        sourceField: 'availableBalance',
        description: 'CASA savings balance maintained over ₹25,00,000 for 90+ consecutive days',
        observedValue: '₹34,80,000',
        previousValue: '₹32,50,000',
        changeDirection: 'INCREASE',
        contributionType: 'PRIMARY',
        contributionWeight: 'High',
      },
      {
        evidenceType: 'ANALYTIC_RESULT',
        sourceEngine: 'ANALYTICS',
        sourceEntityType: 'PORTFOLIO',
        sourceEntityId: 'AN-YIELD-10482',
        sourceField: 'yieldGap',
        description: 'Idle liquidity yield gap calculated at 3.85% versus prevailing Senior Term Deposit rates',
        observedValue: '3.85% Drag',
        previousValue: null,
        changeDirection: 'TRIGGERED',
        contributionType: 'SUPPORTING',
        contributionWeight: 'Medium',
      },
    ],
    sourceChain: [
      {
        orderIndex: 0,
        sourceType: 'CUSTOMER',
        sourceId: 'CUS-10482',
        sourceEngine: 'CORE_REGISTRY',
        description: 'Customer master record and demographic profile',
      },
      {
        orderIndex: 1,
        sourceType: 'HOUSEHOLD',
        sourceId: 'HH-10482',
        sourceEngine: 'RELATIONSHIP_GRAPH',
        description: 'Household network graph links verified parents',
      },
      {
        orderIndex: 2,
        sourceType: 'ACCOUNT',
        sourceId: '10420100089104',
        sourceEngine: 'CASA_LEDGER',
        description: 'Deposit account ledger balances aggregated over 90 days',
      },
      {
        orderIndex: 3,
        sourceType: 'NBA_ENGINE',
        sourceId: 'NBA-RULES',
        sourceEngine: 'NEXT_BEST_ACTION',
        description: 'Next Best Action rule triggered for wealth product expansion',
      },
    ],
  });

  // TRACE 3: Rahul Sharma - Opportunity Radar Working Capital Enhancement
  await decisionTraceService.recordDecisionTrace({
    decisionId: 'DT-20260928-00103',
    customerId: rahul.id,
    userId: adminUser?.id,
    sourceModule: 'OPPORTUNITY_RADAR',
    sourceEngine: 'OPPORTUNITY_RADAR',
    decisionType: 'OPPORTUNITY_RADAR',
    decisionStatus: 'EXECUTED',
    recommendationTitle: 'Expand Working Capital Line on Associate Corporate Turnover Growth',
    recommendationSummary:
      'Associate commercial entity Kalyan Steels registered a 22% quarterly revenue growth with positive supplier payment records, justifying credit limit augmentation.',
    decisionMode: 'HYBRID',
    confidence: '91%',
    confidenceBasis: 'Deterministic evidence + AI-generated explanation',
    limitations: [
      'This does not determine loan eligibility or formal credit sanctions.',
      'Statutory CMA data and collateral valuation must be verified per credit policy.',
    ],
    actionTitle: 'Initiate Credit Appraisal for Credit Facility Limit Enhancement',
    actionType: 'CREDIT_APPRAISAL_INITIATED',
    evidence: [
      {
        evidenceType: 'CUSTOMER_FACT',
        sourceEngine: 'RELATIONSHIP_GRAPH',
        sourceEntityType: 'BUSINESS',
        sourceEntityId: 'BIZ-10482',
        sourceField: 'revenueGrowth',
        description: 'Associate corporate entity reported audited turnover growth of 22% in FY25',
        observedValue: '22% YoY',
        previousValue: '12% YoY',
        changeDirection: 'INCREASE',
        contributionType: 'PRIMARY',
        contributionWeight: 'High',
      },
      {
        evidenceType: 'DOCUMENT_EVENT',
        sourceEngine: 'DOCUMENT_INTELLIGENCE',
        sourceEntityType: 'DOCUMENT',
        sourceEntityId: 'DOC-90142',
        sourceField: 'verificationStatus',
        description: 'Audited Financial Statements FY25 verified via Document Intelligence OCR Vault',
        observedValue: 'VERIFIED',
        previousValue: 'PENDING',
        changeDirection: 'RESOLVED',
        contributionType: 'SUPPORTING',
        contributionWeight: 'Medium',
      },
    ],
    sourceChain: [
      {
        orderIndex: 0,
        sourceType: 'CUSTOMER',
        sourceId: 'CUS-10482',
        sourceEngine: 'CORE_REGISTRY',
        description: 'Customer CIF and corporate director linkages',
      },
      {
        orderIndex: 1,
        sourceType: 'BUSINESS',
        sourceId: 'BIZ-10482',
        sourceEngine: 'RELATIONSHIP_GRAPH',
        description: 'Corporate relationship edge verified in graph',
      },
      {
        orderIndex: 2,
        sourceType: 'DOCUMENT',
        sourceId: 'DOC-90142',
        sourceEngine: 'DOCUMENT_INTELLIGENCE',
        description: 'Financial statements ingested and OCR validated',
      },
      {
        orderIndex: 3,
        sourceType: 'OPPORTUNITY_RADAR',
        sourceId: 'RADAR-CORP',
        sourceEngine: 'OPPORTUNITY_RADAR',
        description: 'Opportunity Radar identified credit expansion trigger',
      },
    ],
  });

  // Update Trace 3 to EXECUTED with outcome
  const [t3] = await db
    .select()
    .from(decisionTraces)
    .where(eq(decisionTraces.decisionId, 'DT-20260928-00103'))
    .limit(1);

  if (t3) {
    await db
      .update(decisionTraces)
      .set({
        decisionStatus: 'EXECUTED',
        confirmedById: adminUser?.id,
        confirmedAt: new Date(Date.now() - 3600000 * 24),
        executionStatus: 'SUCCESS',
        executedAt: new Date(Date.now() - 3600000 * 12),
        outcome: 'Credit appraisal application logged in Lending Hub with appraisal ref CR-APP-9014.',
      })
      .where(eq(decisionTraces.id, t3.id));
  }

  // TRACE 4: Rahul Sharma - Signal Center: Unresolved Service Ticket SLA Alert
  await decisionTraceService.recordDecisionTrace({
    decisionId: 'DT-20260928-00104',
    customerId: rahul.id,
    userId: adminUser?.id,
    sourceModule: 'SIGNAL_CENTER',
    sourceEngine: 'SIGNAL_CENTER',
    decisionType: 'RELATIONSHIP_SIGNAL',
    decisionStatus: 'PENDING',
    recommendationTitle: 'Priority Escalation: Customer Service Ticket Exceeded 24h SLA',
    recommendationSummary:
      'High-severity service case ticket CASE-104 exceeded institutional 24-hour turnaround threshold, posing relationship friction risk.',
    decisionMode: 'SYSTEM_RULE',
    confidence: null,
    confidenceBasis: 'Rule-based',
    limitations: [
      'Triggered automatically by institutional SLA monitoring cron scanner.',
      'Requires human confirmation before customer outreach.',
    ],
    actionTitle: 'Escalate to Branch Service Manager for Immediate Resolution',
    actionType: 'ESCALATE_TICKET',
    evidence: [
      {
        evidenceType: 'SERVICE_EVENT',
        sourceEngine: 'SERVICE_DESK',
        sourceEntityType: 'SERVICE_CASE',
        sourceEntityId: 'CASE-104',
        sourceField: 'slaBreached',
        description: 'Service case response time exceeded 24 hour SLA window',
        observedValue: 'BREACHED (+6.5h)',
        previousValue: 'STANDARD',
        changeDirection: 'BREACHED',
        contributionType: 'PRIMARY',
        contributionWeight: 'Critical',
      },
    ],
    sourceChain: [
      {
        orderIndex: 0,
        sourceType: 'SERVICE_CASE',
        sourceId: 'CASE-104',
        sourceEngine: 'SERVICE_DESK',
        description: 'Original service ticket logged by customer',
      },
      {
        orderIndex: 1,
        sourceType: 'SIGNAL_CENTER',
        sourceId: 'SIG-SLA-104',
        sourceEngine: 'SIGNAL_CENTER',
        description: 'Real-time signal generated upon SLA timer expiry',
      },
    ],
  });

  if (kalyan) {
    // TRACE 5: Kalyan Steels - Trade Finance LC Facility Renewal Review
    await decisionTraceService.recordDecisionTrace({
      decisionId: 'DT-20260928-00201',
      customerId: kalyan.id,
      userId: adminUser?.id,
      sourceModule: 'TRADE_FINANCE',
      sourceEngine: 'RELATIONSHIP_INTELLIGENCE',
      decisionType: 'PRODUCT_OPPORTUNITY',
      decisionStatus: 'PENDING',
      recommendationTitle: 'Review Letter of Credit Limit Adequacy for Import Raw Materials',
      recommendationSummary:
        'Kalyan Steels has utilized 89% of its active Inland LC line across multiple vendor shipments, indicating approaching capacity constraints.',
      decisionMode: 'HYBRID',
      confidence: '85%',
      confidenceBasis: 'Deterministic evidence + AI-generated explanation',
      limitations: [
        'Facility revision requires sanctioned security coverage and maker-checker approval.',
        'Subject to RBI foreign exchange and letter of credit guidelines.',
      ],
      actionTitle: 'Initiate Trade Credit Limit Reassessment',
      actionType: 'TRADE_CREDIT_REVIEW',
      evidence: [
        {
          evidenceType: 'PRODUCT_EVENT',
          sourceEngine: 'TRADE_FINANCE',
          sourceEntityType: 'TRADE_ITEM',
          sourceEntityId: 'LC-849102',
          sourceField: 'utilizationPercentage',
          description: 'Inland LC facility utilization reached 89% of sanctioned ceiling',
          observedValue: '89.2%',
          previousValue: '65.0%',
          changeDirection: 'INCREASE',
          contributionType: 'PRIMARY',
          contributionWeight: 'High',
        },
      ],
      sourceChain: [
        {
          orderIndex: 0,
          sourceType: 'CUSTOMER',
          sourceId: 'CUS-20841',
          sourceEngine: 'CORE_REGISTRY',
          description: 'Corporate customer master profile',
        },
        {
          orderIndex: 1,
          sourceType: 'TRADE_ITEM',
          sourceId: 'LC-849102',
          sourceEngine: 'TRADE_FINANCE',
          description: 'Active LC ledger utilization entries aggregated',
        },
      ],
    });
  }

  console.log('✅ Phase 29 Decision Trace synthetic data successfully seeded.');
}

// Direct execution via tsx
if (process.argv[1]?.endsWith('seedDecisionTraces.ts')) {
  seedDecisionTraces()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Failed to seed Decision Traces:', err);
      process.exit(1);
    });
}
