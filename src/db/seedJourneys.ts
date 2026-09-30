/**
 * COREvia Phase 33: Customer Journey Orchestrator Seed Data
 * Creates journey tables if not present, populates default templates,
 * and sets up canonical synthetic journeys for demonstration and regression tests.
 */

import { db } from './index.ts';
import { sql } from 'drizzle-orm';
import { customers, users, documents, tasks, serviceCases, opportunities, interactions } from './schema.ts';
import { eq } from 'drizzle-orm';
import { journeyService } from '../services/journey.service.ts';
import { journeyRepository } from '../repositories/journey.repository.ts';

export async function ensureJourneyTablesExist() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS journey_templates (
      id SERIAL PRIMARY KEY,
      template_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'LIFECYCLE',
      default_priority TEXT NOT NULL DEFAULT 'NORMAL',
      target_duration_days INTEGER NOT NULL DEFAULT 14,
      default_owner_role TEXT NOT NULL DEFAULT 'RELATIONSHIP_MANAGER',
      is_active BOOLEAN NOT NULL DEFAULT true,
      metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS journey_template_steps (
      id SERIAL PRIMARY KEY,
      template_id INTEGER NOT NULL REFERENCES journey_templates(id) ON DELETE CASCADE,
      step_order INTEGER NOT NULL,
      step_key TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      step_type TEXT NOT NULL,
      required BOOLEAN NOT NULL DEFAULT true,
      sla_days INTEGER NOT NULL DEFAULT 3,
      dependency_step_keys JSONB,
      default_owner_role TEXT NOT NULL DEFAULT 'RELATIONSHIP_MANAGER',
      evidence_type TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS customer_journeys (
      id SERIAL PRIMARY KEY,
      journey_id TEXT NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      template_id INTEGER REFERENCES journey_templates(id),
      journey_type TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'NOT_STARTED',
      priority TEXT NOT NULL DEFAULT 'NORMAL',
      owner_id INTEGER REFERENCES users(id),
      owner_role TEXT NOT NULL DEFAULT 'RELATIONSHIP_MANAGER',
      current_step_id INTEGER,
      started_at TIMESTAMP,
      target_completion_at TIMESTAMP,
      completed_at TIMESTAMP,
      blocked_reason TEXT,
      blocked_at TIMESTAMP,
      sla_status TEXT NOT NULL DEFAULT 'ON_TRACK',
      escalated_at TIMESTAMP,
      escalated_to INTEGER REFERENCES users(id),
      escalated_by INTEGER REFERENCES users(id),
      escalation_reason TEXT,
      decision_trace_id TEXT,
      metadata JSONB,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS customer_journey_steps (
      id SERIAL PRIMARY KEY,
      journey_id INTEGER NOT NULL REFERENCES customer_journeys(id) ON DELETE CASCADE,
      step_id TEXT NOT NULL,
      step_number INTEGER NOT NULL,
      step_key TEXT NOT NULL,
      step_type TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      owner_id INTEGER REFERENCES users(id),
      owner_role TEXT,
      required BOOLEAN NOT NULL DEFAULT true,
      dependency TEXT,
      sla_days INTEGER NOT NULL DEFAULT 3,
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
      due_at TIMESTAMP,
      sla_status TEXT NOT NULL DEFAULT 'ON_TRACK',
      blocked_reason TEXT,
      completion_evidence JSONB,
      notes TEXT,
      metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS journey_outcomes (
      id SERIAL PRIMARY KEY,
      journey_id INTEGER NOT NULL REFERENCES customer_journeys(id) ON DELETE CASCADE,
      outcome_type TEXT NOT NULL,
      outcome TEXT NOT NULL,
      summary TEXT NOT NULL,
      evidence JSONB,
      recorded_by INTEGER NOT NULL REFERENCES users(id),
      recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
      metadata JSONB
    );
  `);
}

export async function seedJourneys(): Promise<void> {
  console.log('--- Initializing Phase 33 Customer Journey Orchestrator Tables & Seed Data ---');

  // 1. Ensure tables exist
  await ensureJourneyTablesExist();

  // 2. Ensure default 10 templates exist
  await journeyService.ensureTemplates();

  // 3. Find canonical customer Rahul Sharma (ID 1)
  const [rahul] = await db.select().from(customers).where(eq(customers.id, 1)).limit(1);
  if (!rahul) {
    console.warn('⚠️ Canonical customer 1 (Rahul Sharma) not found. Skipping journey instances seed.');
    return;
  }

  // 4. Find admin or RM user
  const [admin] = await db.select().from(users).where(eq(users.role, 'ADMINISTRATOR')).limit(1);
  const officerId = admin ? admin.id : 1;

  // Check if Rahul Sharma already has seeded journeys
  const existing = await journeyRepository.listJourneys({ customerId: rahul.id });
  if (existing.length > 0) {
    console.log('✅ Customer Journeys already seeded for canonical customers.');
    return;
  }

  // Fetch some real entities for evidence linking
  const [doc] = await db.select().from(documents).where(eq(documents.customerId, rahul.id)).limit(1);
  const [task] = await db.select().from(tasks).where(eq(tasks.customerId, rahul.id)).limit(1);
  const [sc] = await db.select().from(serviceCases).where(eq(serviceCases.customerId, rahul.id)).limit(1);
  const [opp] = await db.select().from(opportunities).where(eq(opportunities.customerId, rahul.id)).limit(1);
  const [inter] = await db.select().from(interactions).where(eq(interactions.customerId, rahul.id)).limit(1);

  const safeAdminUser = {
    id: officerId,
    uid: admin?.uid || 'USR-ADMIN',
    name: admin?.name || 'Vikramaditya Rao',
    email: admin?.email || 'admin@corevia.bank',
    employeeId: admin?.employeeId || 'EMP-1001',
    role: 'ADMINISTRATOR',
    roleName: 'System Administrator',
    department: 'Executive Operations',
    status: 'ACTIVE',
    permissions: ['admin:all', 'customers:read', 'cases:manage'],
  };

  console.log(`Seeding realistic customer journeys for ${rahul.name}...`);

  // JOURNEY 1: Loan Application (Active, 75% complete)
  const loanJourney = await journeyService.createJourney(
    {
      customerId: rahul.id,
      templateCode: 'LOAN_APPLICATION',
      name: 'Working Capital Facility Limit Renewal (₹5.0 Cr)',
      priority: 'HIGH',
      ownerId: officerId,
    },
    safeAdminUser,
    'REQ-SEED-JRN-01'
  );

  // Complete Step 1 & 2 & 3 for loanJourney to simulate real progress
  if (loanJourney.steps && loanJourney.steps.length >= 3) {
    const s1 = loanJourney.steps[0];
    const s2 = loanJourney.steps[1];
    const s3 = loanJourney.steps[2];
    const s4 = loanJourney.steps[3];

    await journeyService.updateStep(
      loanJourney.id,
      s1.id,
      {
        status: 'COMPLETED',
        completionEvidence: {
          evidenceType: 'OPPORTUNITY',
          entityId: opp?.id || 1,
          entityCode: opp?.opportunityCode || 'OPP-10482-01',
          summary: 'Working capital renewal memorandum vetted and approved by RM.',
          verifiedAt: new Date().toISOString(),
          verifiedBy: officerId,
        },
      },
      safeAdminUser,
      'REQ-SEED-S1'
    );

    await journeyService.updateStep(
      loanJourney.id,
      s2.id,
      {
        status: 'COMPLETED',
        completionEvidence: {
          evidenceType: 'DOCUMENT',
          entityId: doc?.id || 1,
          entityCode: doc?.documentCode || 'DOC-10482-01',
          summary: 'Title search report and hypothecation deed verified.',
          verifiedAt: new Date().toISOString(),
          verifiedBy: officerId,
        },
      },
      safeAdminUser,
      'REQ-SEED-S2'
    );

    await journeyService.updateStep(
      loanJourney.id,
      s3.id,
      {
        status: 'COMPLETED',
        completionEvidence: {
          evidenceType: 'APPROVAL',
          entityId: 'SANCTION-2026-092',
          entityCode: 'SANCTION-2026-092',
          summary: 'Credit committee sanctioned ₹5.0 Cr limit under standard pricing.',
          verifiedAt: new Date().toISOString(),
          verifiedBy: officerId,
        },
      },
      safeAdminUser,
      'REQ-SEED-S3'
    );

    // Step 4 in progress
    await journeyService.updateStep(
      loanJourney.id,
      s4.id,
      {
        status: 'IN_PROGRESS',
        notes: 'Awaiting stamping and board resolution signoff from client corporate secretary.',
      },
      safeAdminUser,
      'REQ-SEED-S4'
    );
  }

  // JOURNEY 2: Service Recovery (Blocked at Step 2)
  const recoveryJourney = await journeyService.createJourney(
    {
      customerId: rahul.id,
      templateCode: 'SERVICE_RECOVERY',
      name: 'High-Value Wire Friction & Dispute Remediation',
      priority: 'CRITICAL',
      ownerId: officerId,
    },
    safeAdminUser,
    'REQ-SEED-JRN-02'
  );

  if (recoveryJourney.steps && recoveryJourney.steps.length >= 2) {
    const s1 = recoveryJourney.steps[0];
    const s2 = recoveryJourney.steps[1];

    await journeyService.updateStep(
      recoveryJourney.id,
      s1.id,
      {
        status: 'COMPLETED',
        completionEvidence: {
          evidenceType: 'SERVICE_CASE',
          entityId: sc?.id || 1,
          entityCode: sc?.caseNumber || 'CAS-10482-01',
          summary: 'Customer grievance #128 regarding cross-border wire delay diagnosed.',
          verifiedAt: new Date().toISOString(),
          verifiedBy: officerId,
        },
      },
      safeAdminUser,
      'REQ-SEED-REC-01'
    );

    // Step 2 BLOCKED
    await journeyService.updateStep(
      recoveryJourney.id,
      s2.id,
      {
        status: 'BLOCKED',
        blockedReason: 'Fee reversal of ₹45,000 exceeds single-maker authority; pending Branch Operations Head checker approval.',
      },
      safeAdminUser,
      'REQ-SEED-REC-02'
    );
  }

  // JOURNEY 3: Relationship Review (Active, Step 1 complete, Step 2 ready)
  const reviewJourney = await journeyService.createJourney(
    {
      customerId: rahul.id,
      templateCode: 'RELATIONSHIP_REVIEW',
      name: 'Annual Strategic Banking & Pricing Review 2026',
      priority: 'NORMAL',
      ownerId: officerId,
    },
    safeAdminUser,
    'REQ-SEED-JRN-03'
  );

  if (reviewJourney.steps && reviewJourney.steps.length >= 1) {
    const s1 = reviewJourney.steps[0];
    await journeyService.updateStep(
      reviewJourney.id,
      s1.id,
      {
        status: 'COMPLETED',
        completionEvidence: {
          evidenceType: 'TASK',
          entityId: task?.id || 1,
          entityCode: task ? `TSK-${task.id}` : 'TSK-10482-01',
          summary: 'Annual relationship dossier and multi-product scorecard assembled.',
          verifiedAt: new Date().toISOString(),
          verifiedBy: officerId,
        },
      },
      safeAdminUser,
      'REQ-SEED-REV-01'
    );
  }

  // JOURNEY 4: Product Adoption (Completed 100%)
  const adoptionJourney = await journeyService.createJourney(
    {
      customerId: rahul.id,
      templateCode: 'PRODUCT_ADOPTION',
      name: 'Digital Cash Management & Host-to-Host Activation',
      priority: 'NORMAL',
      ownerId: officerId,
    },
    safeAdminUser,
    'REQ-SEED-JRN-04'
  );

  if (adoptionJourney.steps) {
    for (const step of adoptionJourney.steps) {
      await journeyService.updateStep(
        adoptionJourney.id,
        step.id,
        {
          status: 'COMPLETED',
          completionEvidence: {
            evidenceType: 'MANUAL_VERIFICATION',
            entityId: 100 + step.stepNumber,
            entityCode: `VERIF-PRD-${step.stepNumber}`,
            summary: `Verified execution of ${step.name}.`,
            verifiedAt: new Date().toISOString(),
            verifiedBy: officerId,
          },
        },
        safeAdminUser,
        `REQ-SEED-ADOPT-${step.stepNumber}`
      );
    }
  }

  // Seed journey for Customer 2 (Kalyan Jewellers)
  const [kalyan] = await db.select().from(customers).where(eq(customers.id, 2)).limit(1);
  if (kalyan) {
    await journeyService.createJourney(
      {
        customerId: kalyan.id,
        templateCode: 'NEW_CUSTOMER_ONBOARDING',
        name: 'New Corporate Account & Bullion Credit Onboarding',
        priority: 'HIGH',
        ownerId: officerId,
      },
      safeAdminUser,
      'REQ-SEED-JRN-05'
    );
  }

  console.log('✅ Customer Journeys seeded successfully.');
}
