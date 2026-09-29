/**
 * COREvia Phase 31: Governed Agent Demonstration Seed Data
 * Seeds initial session and the canonical Rahul Sharma relationship recovery plan.
 */

import { db } from './index.ts';
import { customers, users, agentSessions, agentPlans, agentPlanSteps } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function seedAgentPlans() {
  console.log('Seeding Phase 31 Governed Agent Sessions & Plans...');

  // 1. Get canonical customer Rahul Sharma (ID 1)
  const [rahul] = await db.select().from(customers).where(eq(customers.id, 1)).limit(1);
  if (!rahul) {
    console.warn('⚠️ Canonical customer 1 (Rahul Sharma) not found. Skipping Agent seed.');
    return;
  }

  // 2. Get officer user (e.g. Vikramaditya or Admin)
  const [officer] = await db.select().from(users).limit(1);
  const officerId = officer ? officer.id : 1;

  // Check if seed plan or session already exists
  const existingSessions = await db
    .select()
    .from(agentSessions)
    .where(eq(agentSessions.sessionId, 'SES-20260929-001'))
    .limit(1);

  if (existingSessions.length > 0) {
    // Check if plans exist
    const plans = await db.select().from(agentPlans).where(eq(agentPlans.planId, 'PLN-RECOVERY-RAHUL-001')).limit(1);
    if (plans.length > 0) {
      console.log('✅ Governed Agent demonstration plans already seeded.');
      return;
    }
    // Incomplete seed: clean up and re-insert
    await db.delete(agentSessions).where(eq(agentSessions.sessionId, 'SES-20260929-001'));
  }

  // 3. Create Session 1: Awaiting Approval (Relationship Recovery)
  const [session1] = await db
    .insert(agentSessions)
    .values({
      sessionId: 'SES-20260929-001',
      userId: officerId,
      customerId: rahul.id,
      contextType: 'CUSTOMER',
      contextId: 'CUS-10482',
      status: 'AWAITING_APPROVAL',
      metadata: {
        launchOrigin: 'CUSTOMER_360',
        initialQuery: 'Help me recover Rahul Sharma\'s relationship.',
        recentScore: 79,
        momentum: 'DECLINING',
      },
    })
    .returning();

  // 4. Create Plan 1: Canonical Relationship Recovery Plan
  const [plan1] = await db
    .insert(agentPlans)
    .values({
      planId: 'PLN-RECOVERY-RAHUL-001',
      sessionId: session1.id,
      customerId: rahul.id,
      title: 'Rahul Sharma Relationship Recovery Plan',
      objective: 'Clear service ticket friction, conduct executive review, unblock commercial deal, and restore CORE momentum.',
      status: 'AWAITING_APPROVAL',
      planVersion: 1,
      decisionTraceId: 'DT-20260929-001',
      scenarioId: 'STR-20260928-003',
      planRationale: 'Deterministic COREvia relationship recovery sequence targeting declining momentum, unresolved net-banking dispute, and stalled credit enhancement.',
      estimatedEffect: 'CORE Score projected to recover +6.8 pts (79 -> 85.8), restoring Low Attrition Risk status.',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    .returning();

  // 5. Seed Steps for Plan 1
  const stepsData = [
    {
      planId: plan1.id,
      stepNumber: 1,
      actionType: 'GET_SERVICE_CASES',
      targetEntityType: 'SERVICE_CASE',
      targetEntityId: 'CS-2041',
      parameters: { customerId: rahul.id, status: 'OPEN' },
      rationale: 'Inspect active service dispute regarding international wire charges and net-banking portal access.',
      requiredPermission: 'case:read',
      status: 'PENDING',
      requiresConfirmation: false,
      dependsOnStepNumber: null,
      dependencyPolicy: 'SKIP',
    },
    {
      planId: plan1.id,
      stepNumber: 2,
      actionType: 'UPDATE_SERVICE_CASE',
      targetEntityType: 'SERVICE_CASE',
      targetEntityId: '1',
      parameters: {
        status: 'RESOLVED',
        resolutionSummary: 'Fee adjustment waiver approved and SWIFT MT103 copy provided to customer.',
      },
      rationale: 'Resolve open service friction to satisfy prerequisite for relationship review.',
      requiredPermission: 'case:update',
      status: 'PENDING',
      requiresConfirmation: true,
      dependsOnStepNumber: 1,
      dependencyPolicy: 'REQUIRE_REVIEW',
      idempotencyKey: 'SES-20260929-001:PLN-RECOVERY-RAHUL-001:STEP-2',
    },
    {
      planId: plan1.id,
      stepNumber: 3,
      actionType: 'CREATE_RELATIONSHIP_REVIEW',
      targetEntityType: 'RELATIONSHIP_REVIEW',
      targetEntityId: 'RR-2026-10482',
      parameters: {
        title: 'Q4 Institutional Relationship Review: Rahul Sharma',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'HIGH',
      },
      rationale: 'Schedule formal relationship governance cadence meeting with Relationship Manager.',
      requiredPermission: 'customer:update',
      status: 'PENDING',
      requiresConfirmation: true,
      dependsOnStepNumber: 2,
      dependencyPolicy: 'SKIP',
      idempotencyKey: 'SES-20260929-001:PLN-RECOVERY-RAHUL-001:STEP-3',
    },
    {
      planId: plan1.id,
      stepNumber: 4,
      actionType: 'UPDATE_OPPORTUNITY',
      targetEntityType: 'OPPORTUNITY',
      targetEntityId: '1',
      parameters: {
        stage: 'PROPOSAL',
        notes: 'Followed up with client during service resolution; proposal documentation ready.',
      },
      rationale: 'Unblock stalled Working Capital loan enhancement deal OP-10482.',
      requiredPermission: 'opportunity:update',
      status: 'PENDING',
      requiresConfirmation: true,
      dependsOnStepNumber: 3,
      dependencyPolicy: 'SKIP',
      idempotencyKey: 'SES-20260929-001:PLN-RECOVERY-RAHUL-001:STEP-4',
    },
    {
      planId: plan1.id,
      stepNumber: 5,
      actionType: 'CREATE_TASK',
      targetEntityType: 'TASK',
      targetEntityId: 'TASK-NEW',
      parameters: {
        title: 'Deliver executed commercial facility term sheet to Rahul Sharma',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'HIGH',
      },
      rationale: 'Assign relationship manager follow-up task to confirm receipt of sanctioned terms.',
      requiredPermission: 'task:create',
      status: 'PENDING',
      requiresConfirmation: true,
      dependsOnStepNumber: 4,
      dependencyPolicy: 'SKIP',
      idempotencyKey: 'SES-20260929-001:PLN-RECOVERY-RAHUL-001:STEP-5',
    },
    {
      planId: plan1.id,
      stepNumber: 6,
      actionType: 'CREATE_NOTIFICATION',
      targetEntityType: 'NOTIFICATION',
      targetEntityId: 'NOTIF-NEW',
      parameters: {
        title: 'Rahul Sharma Recovery Milestones Executed',
        message: 'All governed recovery actions successfully completed for customer CUS-10482.',
      },
      rationale: 'Notify branch leadership and relationship officer of completed recovery milestones.',
      requiredPermission: 'notification:create',
      status: 'PENDING',
      requiresConfirmation: true,
      dependsOnStepNumber: 5,
      dependencyPolicy: 'SKIP',
      idempotencyKey: 'SES-20260929-001:PLN-RECOVERY-RAHUL-001:STEP-6',
    },
  ];

  for (const s of stepsData) {
    await db.insert(agentPlanSteps).values(s);
  }

  // 6. Create Session 2 & Plan 2: Pre-Executed Historical Plan (Demonstrating verification and audit report)
  await db.delete(agentSessions).where(eq(agentSessions.sessionId, 'SES-20260928-002'));
  const [session2] = await db
    .insert(agentSessions)
    .values({
      sessionId: 'SES-20260928-002',
      userId: officerId,
      customerId: rahul.id,
      contextType: 'CUSTOMER',
      contextId: 'CUS-10482',
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      endedAt: new Date(Date.now() - 47 * 60 * 60 * 1000),
      metadata: {
        launchOrigin: 'OPPORTUNITY_RADAR',
        initialQuery: 'Prepare loan renewal follow-up plan.',
      },
    })
    .returning();

  const [plan2] = await db
    .insert(agentPlans)
    .values({
      planId: 'PLN-RENEWAL-RAHUL-002',
      sessionId: session2.id,
      customerId: rahul.id,
      title: 'Facility Review & KYC Verification Plan',
      objective: 'Annual KYC status verification and term deposit renewal alignment.',
      status: 'COMPLETED',
      planVersion: 2,
      approvedAt: new Date(Date.now() - 47.8 * 60 * 60 * 1000),
      approvedBy: officerId,
      completedAt: new Date(Date.now() - 47 * 60 * 60 * 1000),
      planRationale: 'Regulatory mandate for annual HNW facility re-verification.',
    })
    .returning();

  await db.insert(agentPlanSteps).values([
    {
      planId: plan2.id,
      stepNumber: 1,
      actionType: 'GET_DOCUMENT_STATUS',
      targetEntityType: 'DOCUMENT',
      targetEntityId: 'DOC-KYC-01',
      parameters: { customerId: rahul.id },
      rationale: 'Verify PAN and Form 60 verification validity in core archives.',
      requiredPermission: 'document:read',
      status: 'COMPLETED',
      requiresConfirmation: false,
      resultSummary: 'Verified valid PAN on file and CKYC identifier mapped.',
      completedAt: new Date(Date.now() - 47.5 * 60 * 60 * 1000),
      verifiedAt: new Date(Date.now() - 47.5 * 60 * 60 * 1000),
      auditLogId: 101,
    },
    {
      planId: plan2.id,
      stepNumber: 2,
      actionType: 'CREATE_TASK',
      targetEntityType: 'TASK',
      targetEntityId: '42',
      parameters: {
        title: 'Dispatch Annual Facility Renewal Letter to Rahul Sharma',
        dueDate: '2026-10-01',
      },
      rationale: 'Execute renewal dispatch task assigned to RM.',
      requiredPermission: 'task:create',
      status: 'COMPLETED',
      requiresConfirmation: true,
      resultSummary: 'Task #42 created and assigned to Relationship Manager.',
      completedAt: new Date(Date.now() - 47.2 * 60 * 60 * 1000),
      verifiedAt: new Date(Date.now() - 47.2 * 60 * 60 * 1000),
      auditLogId: 102,
      idempotencyKey: 'SES-20260928-002:PLN-RENEWAL-RAHUL-002:STEP-2',
    },
  ]);

  console.log('✅ Governed Agent demonstration plans seeded successfully.');
}
