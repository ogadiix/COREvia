/**
 * COREvia Phase 36: Banking Operations Workspace Seed & DDL
 * Creates operational_approvals, operational_exceptions, reconciliation_records, operational_events tables if not present.
 * Seeds realistic synthetic operational data for canonical customers.
 */

import { db } from './index.ts';
import { sql } from 'drizzle-orm';
import {
  operationalApprovals,
  operationalExceptions,
  reconciliationRecords,
  operationalEvents,
  customers,
  users,
} from './schema.ts';

export async function ensureOperationsTablesExist(): Promise<void> {
  // 1. operational_approvals
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS operational_approvals (
      id SERIAL PRIMARY KEY,
      approval_id TEXT NOT NULL UNIQUE,
      request_type TEXT NOT NULL,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      customer_code TEXT,
      customer_name TEXT,
      related_entity_type TEXT,
      related_entity_id TEXT,
      amount NUMERIC(15, 2),
      currency TEXT NOT NULL DEFAULT 'INR',
      maker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      maker_name TEXT NOT NULL,
      maker_role TEXT,
      checker_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      checker_name TEXT,
      checker_role TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      priority TEXT NOT NULL DEFAULT 'MEDIUM',
      reason TEXT NOT NULL,
      evidence JSONB,
      checker_notes TEXT,
      sla_deadline TIMESTAMP,
      actioned_at TIMESTAMP,
      metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_oa_approval_id ON operational_approvals(approval_id);
    CREATE INDEX IF NOT EXISTS idx_oa_status ON operational_approvals(status);
    CREATE INDEX IF NOT EXISTS idx_oa_request_type ON operational_approvals(request_type);
    CREATE INDEX IF NOT EXISTS idx_oa_customer_id ON operational_approvals(customer_id);
    CREATE INDEX IF NOT EXISTS idx_oa_maker_id ON operational_approvals(maker_id);
    CREATE INDEX IF NOT EXISTS idx_oa_checker_id ON operational_approvals(checker_id);
    CREATE INDEX IF NOT EXISTS idx_oa_priority ON operational_approvals(priority);
    CREATE INDEX IF NOT EXISTS idx_oa_sla_deadline ON operational_approvals(sla_deadline);
  `);

  // 2. operational_exceptions
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS operational_exceptions (
      id SERIAL PRIMARY KEY,
      exception_id TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'MEDIUM',
      source TEXT NOT NULL,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      customer_code TEXT,
      customer_name TEXT,
      related_entity_type TEXT,
      related_entity_id TEXT,
      description TEXT NOT NULL,
      evidence JSONB,
      status TEXT NOT NULL DEFAULT 'OPEN',
      owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      owner_name TEXT,
      owner_role TEXT,
      sla_deadline TIMESTAMP,
      resolution_notes TEXT,
      resolved_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      resolved_by_name TEXT,
      resolved_at TIMESTAMP,
      metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_oex_exception_id ON operational_exceptions(exception_id);
    CREATE INDEX IF NOT EXISTS idx_oex_category ON operational_exceptions(category);
    CREATE INDEX IF NOT EXISTS idx_oex_severity ON operational_exceptions(severity);
    CREATE INDEX IF NOT EXISTS idx_oex_status ON operational_exceptions(status);
    CREATE INDEX IF NOT EXISTS idx_oex_customer_id ON operational_exceptions(customer_id);
    CREATE INDEX IF NOT EXISTS idx_oex_owner_id ON operational_exceptions(owner_id);
    CREATE INDEX IF NOT EXISTS idx_oex_sla_deadline ON operational_exceptions(sla_deadline);
  `);

  // 3. reconciliation_records
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS reconciliation_records (
      id SERIAL PRIMARY KEY,
      reconciliation_id TEXT NOT NULL UNIQUE,
      business_date DATE NOT NULL,
      source TEXT NOT NULL,
      reconciliation_type TEXT NOT NULL,
      expected_value NUMERIC(15, 2) NOT NULL,
      observed_value NUMERIC(15, 2) NOT NULL,
      variance NUMERIC(15, 2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'MISMATCH',
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      account_number TEXT,
      owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      owner_name TEXT,
      last_checked TIMESTAMP NOT NULL DEFAULT NOW(),
      notes TEXT,
      adjustment_approval_id TEXT,
      resolved_at TIMESTAMP,
      resolved_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_rec_reconciliation_id ON reconciliation_records(reconciliation_id);
    CREATE INDEX IF NOT EXISTS idx_rec_business_date ON reconciliation_records(business_date);
    CREATE INDEX IF NOT EXISTS idx_rec_type ON reconciliation_records(reconciliation_type);
    CREATE INDEX IF NOT EXISTS idx_rec_status ON reconciliation_records(status);
    CREATE INDEX IF NOT EXISTS idx_rec_customer_id ON reconciliation_records(customer_id);
    CREATE INDEX IF NOT EXISTS idx_rec_owner_id ON reconciliation_records(owner_id);
  `);

  // 4. operational_events
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS operational_events (
      id SERIAL PRIMARY KEY,
      event_id TEXT NOT NULL UNIQUE,
      event_type TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'INFO',
      source_module TEXT NOT NULL,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      related_entity_type TEXT,
      related_entity_id TEXT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      actor_name TEXT,
      actor_role TEXT,
      metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_oev_event_id ON operational_events(event_id);
    CREATE INDEX IF NOT EXISTS idx_oev_type ON operational_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_oev_severity ON operational_events(severity);
    CREATE INDEX IF NOT EXISTS idx_oev_customer_id ON operational_events(customer_id);
    CREATE INDEX IF NOT EXISTS idx_oev_created_at ON operational_events(created_at);
  `);
}

export async function seedOperationsData(): Promise<void> {
  await ensureOperationsTablesExist();

  // Check if already seeded
  const existing = await db.select().from(operationalApprovals).limit(1);
  if (existing.length > 0) {
    return;
  }

  // Fetch canonical users and customers
  const allUsers = await db.select().from(users);
  const adminUser = allUsers.find((u) => u.role === 'ADMINISTRATOR') || allUsers[0];
  const rmUser = allUsers.find((u) => u.role === 'RELATIONSHIP_MANAGER') || allUsers[0];
  const opsUser = allUsers.find((u) => u.role === 'BRANCH_OPS_HEAD' || u.role === 'OPERATIONS') || adminUser;

  const allCustomers = await db.select().from(customers);
  const rahulSharma = allCustomers.find((c) => c.customerCode === 'CUS-10482') || allCustomers[0];
  const priyaSharma = allCustomers.find((c) => c.customerCode === 'CUS-10483') || allCustomers[1] || allCustomers[0];

  const now = new Date();

  // 1. Seed Operational Approvals (Maker / Checker items)
  await db.insert(operationalApprovals).values([
    {
      approvalId: 'APR-2026-10482-01',
      requestType: 'FEE_REVERSAL',
      customerId: rahulSharma?.id || null,
      customerCode: rahulSharma?.customerCode || 'CUS-10482',
      customerName: rahulSharma ? rahulSharma.name : 'Rahul Sharma',
      relatedEntityType: 'ACCOUNT',
      relatedEntityId: 'ACC-10482-001',
      amount: '2450.00',
      currency: 'INR',
      makerId: rmUser.id,
      makerName: rmUser.name,
      makerRole: rmUser.role,
      status: 'PENDING',
      priority: 'HIGH',
      reason: 'Waiver of duplicate outward clearing charge caused by UPI switch gateway timeout on 24-Sep-2026',
      evidence: {
        transactionRef: 'TXN-UPI-992140',
        disputeCaseId: 'CAS-2026-4921',
        chargeBreakdown: [{ fee: 'Clearing Service Fee', amount: 2000 }, { gst: '18% GST', amount: 450 }],
        rmJustification: 'High-value priority banking customer with ₹1.46 Cr relationship value. Gateway error confirmed by switch logs.',
      },
      slaDeadline: new Date(now.getTime() + 18 * 3600000), // in 18 hours
      createdAt: new Date(now.getTime() - 6 * 3600000),
      updatedAt: new Date(now.getTime() - 6 * 3600000),
    },
    {
      approvalId: 'APR-2026-10482-02',
      requestType: 'LIMIT_REVISION',
      customerId: rahulSharma?.id || null,
      customerCode: rahulSharma?.customerCode || 'CUS-10482',
      customerName: rahulSharma ? rahulSharma.name : 'Rahul Sharma',
      relatedEntityType: 'LOAN',
      relatedEntityId: 'OD-SHARMA-AGRO-01',
      amount: '1500000.00',
      currency: 'INR',
      makerId: rmUser.id,
      makerName: rmUser.name,
      makerRole: rmUser.role,
      checkerId: adminUser.id,
      checkerName: adminUser.name,
      checkerRole: adminUser.role,
      status: 'UNDER_REVIEW',
      priority: 'HIGH',
      reason: 'Seasonal working capital overdraft facility enhancement from ₹25L to ₹40L for harvest inventory cycle',
      evidence: {
        financialAuditedYear: 'FY2025-26',
        turnoverReported: '₹ 8.40 Cr',
        cibilScore: 785,
        boardResolutionAttached: true,
      },
      slaDeadline: new Date(now.getTime() + 48 * 3600000),
      createdAt: new Date(now.getTime() - 14 * 3600000),
      updatedAt: new Date(now.getTime() - 2 * 3600000),
    },
    {
      approvalId: 'APR-2026-10483-01',
      requestType: 'DOCUMENT_OVERRIDE',
      customerId: priyaSharma?.id || null,
      customerCode: priyaSharma?.customerCode || 'CUS-10483',
      customerName: priyaSharma ? priyaSharma.name : 'Priya Sharma',
      relatedEntityType: 'DOCUMENT',
      relatedEntityId: 'DOC-REQ-7102',
      amount: null,
      currency: 'INR',
      makerId: opsUser.id,
      makerName: opsUser.name,
      makerRole: opsUser.role,
      checkerId: adminUser.id,
      checkerName: adminUser.name,
      checkerRole: adminUser.role,
      status: 'APPROVED',
      priority: 'MEDIUM',
      reason: 'Accept overseas tax filing assessment order in lieu of local Indian ITR V for NRI deposit facility',
      evidence: {
        documentName: 'HMRC Tax Return FY25',
        notarizedProof: true,
        legalOpinionObtained: true,
      },
      checkerNotes: 'Verified compliant with RBI master direction on NRI deposits. Legal clearance on file.',
      actionedAt: new Date(now.getTime() - 4 * 3600000),
      slaDeadline: new Date(now.getTime() - 10 * 3600000),
      createdAt: new Date(now.getTime() - 28 * 3600000),
      updatedAt: new Date(now.getTime() - 4 * 3600000),
    },
    {
      approvalId: 'APR-2026-00492-01',
      requestType: 'SERVICE_COMPENSATION',
      customerId: rahulSharma?.id || null,
      customerCode: rahulSharma?.customerCode || 'CUS-10482',
      customerName: rahulSharma ? rahulSharma.name : 'Rahul Sharma',
      relatedEntityType: 'SERVICE_CASE',
      relatedEntityId: 'CAS-2026-4921',
      amount: '5000.00',
      currency: 'INR',
      makerId: rmUser.id,
      makerName: rmUser.name,
      makerRole: rmUser.role,
      status: 'PENDING',
      priority: 'MEDIUM',
      reason: 'Goodwill operational credit for extended resolution turnaround on international card chargeback',
      evidence: {
        caseDurationDays: 14,
        standardSlaDays: 7,
        executiveApprovalMemo: 'MEMO-OPS-901',
      },
      slaDeadline: new Date(now.getTime() + 12 * 3600000),
      createdAt: new Date(now.getTime() - 8 * 3600000),
      updatedAt: new Date(now.getTime() - 8 * 3600000),
    },
    {
      approvalId: 'APR-2026-00891-01',
      requestType: 'TRANSACTION_EXCEPTION',
      customerId: null,
      customerCode: null,
      customerName: 'Institutional Clearing Pool',
      relatedEntityType: 'TRANSACTION',
      relatedEntityId: 'TXN-RTGS-882190',
      amount: '450000.00',
      currency: 'INR',
      makerId: opsUser.id,
      makerName: opsUser.name,
      makerRole: opsUser.role,
      status: 'PENDING',
      priority: 'CRITICAL',
      reason: 'Manual posting clearance for unrouted NEFT return batch with ambiguous UTR acknowledgment',
      evidence: {
        utrNumber: 'HDFC262700918231',
        beneficiaryIfsc: 'CORV0001048',
        rbiClearingSequence: 'NEFT-CYCLE-14',
      },
      slaDeadline: new Date(now.getTime() + 4 * 3600000), // approaching SLA (4 hours left)
      createdAt: new Date(now.getTime() - 2 * 3600000),
      updatedAt: new Date(now.getTime() - 2 * 3600000),
    },
  ]);

  // 2. Seed Operational Exceptions
  await db.insert(operationalExceptions).values([
    {
      exceptionId: 'OEX-2026-10482-01',
      category: 'DOCUMENT',
      severity: 'HIGH',
      source: 'DOCUMENT_INTELLIGENCE',
      customerId: rahulSharma?.id || null,
      customerCode: rahulSharma?.customerCode || 'CUS-10482',
      customerName: rahulSharma ? rahulSharma.name : 'Rahul Sharma',
      relatedEntityType: 'DOCUMENT',
      relatedEntityId: 'DOC-GST-SHARMA-01',
      description: 'Annual GST Certificate validity expired on 15-Sep-2026; trade account compliance pending re-submission',
      evidence: {
        documentType: 'GST_CERTIFICATE',
        expiryDate: '2026-09-15',
        daysOverdue: 16,
        impactedAccounts: ['ACC-10482-001', 'OD-SHARMA-AGRO-01'],
      },
      status: 'OPEN',
      ownerId: rmUser.id,
      ownerName: rmUser.name,
      ownerRole: rmUser.role,
      slaDeadline: new Date(now.getTime() + 24 * 3600000),
      createdAt: new Date(now.getTime() - 48 * 3600000),
      updatedAt: new Date(now.getTime() - 48 * 3600000),
    },
    {
      exceptionId: 'OEX-2026-10482-02',
      category: 'SLA',
      severity: 'CRITICAL',
      source: 'SERVICE_DESK',
      customerId: rahulSharma?.id || null,
      customerCode: rahulSharma?.customerCode || 'CUS-10482',
      customerName: rahulSharma ? rahulSharma.name : 'Rahul Sharma',
      relatedEntityType: 'SERVICE_CASE',
      relatedEntityId: 'CAS-2026-4921',
      description: 'Dispute grievance ticket #CAS-2026-4921 breached 48-hour RBI Internal Ombudsman regulatory SLA window',
      evidence: {
        ticketCreated: new Date(now.getTime() - 72 * 3600000).toISOString(),
        targetSlaHours: 48,
        elapsedHours: 72,
        currentQueue: 'CARDS_FRAUD_OPERATIONS',
      },
      status: 'OPEN',
      ownerId: opsUser.id,
      ownerName: opsUser.name,
      ownerRole: opsUser.role,
      slaDeadline: new Date(now.getTime() - 24 * 3600000), // already breached
      createdAt: new Date(now.getTime() - 24 * 3600000),
      updatedAt: new Date(now.getTime() - 1 * 3600000),
    },
    {
      exceptionId: 'OEX-2026-10483-01',
      category: 'KYC',
      severity: 'MEDIUM',
      source: 'ONBOARDING_PIPELINE',
      customerId: priyaSharma?.id || null,
      customerCode: priyaSharma?.customerCode || 'CUS-10483',
      customerName: priyaSharma ? priyaSharma.name : 'Priya Sharma',
      relatedEntityType: 'CUSTOMER',
      relatedEntityId: 'CUS-10483',
      description: 'Periodic re-KYC cycle due. Address proof document verification require maker re-upload confirmation',
      evidence: {
        kycCycle: '2_YEAR_SCHEDULED',
        lastVerified: '2024-09-01',
        discrepancyType: 'ADDRESS_PROOF_PINCODE_MISMATCH',
      },
      status: 'ACKNOWLEDGED',
      ownerId: opsUser.id,
      ownerName: opsUser.name,
      ownerRole: opsUser.role,
      slaDeadline: new Date(now.getTime() + 72 * 3600000),
      createdAt: new Date(now.getTime() - 36 * 3600000),
      updatedAt: new Date(now.getTime() - 12 * 3600000),
    },
    {
      exceptionId: 'OEX-2026-00912-01',
      category: 'TRANSACTION',
      severity: 'HIGH',
      source: 'CORE_BANKING_SWITCH',
      customerId: null,
      customerCode: null,
      customerName: 'Branch Core Switch',
      relatedEntityType: 'TRANSACTION',
      relatedEntityId: 'TXN-SW-9021',
      description: 'Duplicate posting detected on UPI Switch Settlement batch #BTH-9821 during end-of-cycle sync',
      evidence: {
        batchId: 'BTH-9821',
        duplicateRecordsCount: 2,
        totalVariance: '₹ 14,200.00',
        switchCode: 'UPI-NPCI-01',
      },
      status: 'IN_PROGRESS',
      ownerId: opsUser.id,
      ownerName: opsUser.name,
      ownerRole: opsUser.role,
      slaDeadline: new Date(now.getTime() + 8 * 3600000),
      createdAt: new Date(now.getTime() - 16 * 3600000),
      updatedAt: new Date(now.getTime() - 3 * 3600000),
    },
    {
      exceptionId: 'OEX-2026-00945-01',
      category: 'RECONCILIATION',
      severity: 'CRITICAL',
      source: 'RECONCILIATION_JOB',
      customerId: rahulSharma?.id || null,
      customerCode: rahulSharma?.customerCode || 'CUS-10482',
      customerName: rahulSharma ? rahulSharma.name : 'Rahul Sharma',
      relatedEntityType: 'ACCOUNT',
      relatedEntityId: 'ACC-10482-001',
      description: 'CASA core ledger balance discrepancy of ₹ 18,500.00 vs clearing settlement statement',
      evidence: {
        ledgerBalance: '₹ 12,45,000.00',
        observedBalance: '₹ 12,26,500.00',
        unpostedItemRef: 'CLR-CHEQUE-40192',
      },
      status: 'OPEN',
      ownerId: opsUser.id,
      ownerName: opsUser.name,
      ownerRole: opsUser.role,
      slaDeadline: new Date(now.getTime() + 6 * 3600000),
      createdAt: new Date(now.getTime() - 10 * 3600000),
      updatedAt: new Date(now.getTime() - 10 * 3600000),
    },
    {
      exceptionId: 'OEX-2026-00811-01',
      category: 'WORKFLOW',
      severity: 'LOW',
      source: 'JOURNEY_ORCHESTRATOR',
      customerId: rahulSharma?.id || null,
      customerCode: rahulSharma?.customerCode || 'CUS-10482',
      customerName: rahulSharma ? rahulSharma.name : 'Rahul Sharma',
      relatedEntityType: 'JOURNEY',
      relatedEntityId: 'JRN-2026-10482-01',
      description: 'Workflow step retry succeeded: Document extraction verified after OCR re-processing',
      evidence: {
        stepKey: 'sanction_committee_approval',
        previousFailure: 'SOCKET_TIMEOUT',
        remediatedBy: 'AUTOMATED_RETRY_DAEMON',
      },
      status: 'RESOLVED',
      ownerId: adminUser.id,
      ownerName: adminUser.name,
      ownerRole: adminUser.role,
      slaDeadline: new Date(now.getTime() - 48 * 3600000),
      resolutionNotes: 'OCR engine re-processed document page with enhanced contrast filter. Auto-completed on 28-Sep-2026.',
      resolvedById: adminUser.id,
      resolvedByName: adminUser.name,
      resolvedAt: new Date(now.getTime() - 36 * 3600000),
      createdAt: new Date(now.getTime() - 60 * 3600000),
      updatedAt: new Date(now.getTime() - 36 * 3600000),
    },
  ]);

  // 3. Seed Reconciliation Records
  await db.insert(reconciliationRecords).values([
    {
      reconciliationId: 'REC-2026-00301',
      businessDate: '2026-09-30',
      source: 'CASA_CORE_LEDGER',
      reconciliationType: 'ACCOUNT_BALANCE_MISMATCH',
      expectedValue: '1245000.00',
      observedValue: '1226500.00',
      variance: '-18500.00',
      status: 'MISMATCH',
      customerId: rahulSharma?.id || null,
      accountNumber: 'ACC-10482-001',
      ownerId: opsUser.id,
      ownerName: opsUser.name,
      lastChecked: new Date(now.getTime() - 4 * 3600000),
      notes: 'Discrepancy corresponds to unposted inward clearing cheque #CLR-CHEQUE-40192. Investigation ticket open.',
      adjustmentApprovalId: 'APR-2026-10482-01',
      createdAt: new Date(now.getTime() - 24 * 3600000),
      updatedAt: new Date(now.getTime() - 4 * 3600000),
    },
    {
      reconciliationId: 'REC-2026-00302',
      businessDate: '2026-09-30',
      source: 'UPI_SWITCH_CLEARING',
      reconciliationType: 'TRANSACTION_COUNT_MISMATCH',
      expectedValue: '1420.00',
      observedValue: '1418.00',
      variance: '-2.00',
      status: 'INVESTIGATING',
      customerId: null,
      accountNumber: null,
      ownerId: opsUser.id,
      ownerName: opsUser.name,
      lastChecked: new Date(now.getTime() - 2 * 3600000),
      notes: '2 UPI transactions timed out on NPCI switch before bank ACK was registered. Auto-reversal in process.',
      createdAt: new Date(now.getTime() - 18 * 3600000),
      updatedAt: new Date(now.getTime() - 2 * 3600000),
    },
    {
      reconciliationId: 'REC-2026-00303',
      businessDate: '2026-09-30',
      source: 'NEFT_RTGS_SETTLEMENT',
      reconciliationType: 'SETTLEMENT_MISMATCH',
      expectedValue: '48200000.00',
      observedValue: '48200000.00',
      variance: '0.00',
      status: 'MATCHED',
      customerId: null,
      accountNumber: null,
      ownerId: adminUser.id,
      ownerName: adminUser.name,
      lastChecked: new Date(now.getTime() - 1 * 3600000),
      notes: 'All 84 RTGS outward and inward settlement cycles matched with RBI daily statement.',
      resolvedAt: new Date(now.getTime() - 1 * 3600000),
      resolvedById: adminUser.id,
      createdAt: new Date(now.getTime() - 12 * 3600000),
      updatedAt: new Date(now.getTime() - 1 * 3600000),
    },
    {
      reconciliationId: 'REC-2026-00304',
      businessDate: '2026-09-30',
      source: 'LOAN_DISBURSEMENT_REGISTER',
      reconciliationType: 'LOAN_BALANCE_DISCREPANCY',
      expectedValue: '2500000.00',
      observedValue: '2495000.00',
      variance: '-5000.00',
      status: 'ADJUSTMENT_PENDING',
      customerId: rahulSharma?.id || null,
      accountNumber: 'LN-AGRO-2024-001',
      ownerId: opsUser.id,
      ownerName: opsUser.name,
      lastChecked: new Date(now.getTime() - 5 * 3600000),
      notes: 'Upfront processing fee of ₹5,000 deducted at source was recorded in fee ledger rather than principal register.',
      adjustmentApprovalId: 'APR-2026-10482-02',
      createdAt: new Date(now.getTime() - 20 * 3600000),
      updatedAt: new Date(now.getTime() - 5 * 3600000),
    },
  ]);

  // 4. Seed Operational Events Stream
  await db.insert(operationalEvents).values([
    {
      eventId: 'OEV-2026-00401',
      eventType: 'EXCEPTION_OPENED',
      severity: 'CRITICAL',
      sourceModule: 'SERVICE_DESK',
      customerId: rahulSharma?.id || null,
      relatedEntityType: 'SERVICE_CASE',
      relatedEntityId: 'CAS-2026-4921',
      title: 'Ombudsman SLA Breached on Customer Dispute',
      description: 'Grievance ticket #CAS-2026-4921 exceeded 48-hour mandatory regulatory resolution threshold.',
      actorId: adminUser.id,
      actorName: 'COREvia SLA Monitor Daemon',
      actorRole: 'SYSTEM',
      createdAt: new Date(now.getTime() - 24 * 3600000),
    },
    {
      eventId: 'OEV-2026-00402',
      eventType: 'APPROVAL_CREATED',
      severity: 'HIGH',
      sourceModule: 'MAKER_CHECKER',
      customerId: rahulSharma?.id || null,
      relatedEntityType: 'LOAN',
      relatedEntityId: 'OD-SHARMA-AGRO-01',
      title: 'Working Capital Limit Enhancement Requested',
      description: 'RM Siddharth Verma submitted ₹15L limit extension for Sharma Bio-Agro Tech Pvt Ltd.',
      actorId: rmUser.id,
      actorName: rmUser.name,
      actorRole: rmUser.role,
      createdAt: new Date(now.getTime() - 14 * 3600000),
    },
    {
      eventId: 'OEV-2026-00403',
      eventType: 'RECONCILIATION_MISMATCH_DETECTED',
      severity: 'CRITICAL',
      sourceModule: 'RECONCILIATION',
      customerId: rahulSharma?.id || null,
      relatedEntityType: 'ACCOUNT',
      relatedEntityId: 'ACC-10482-001',
      title: 'Ledger Discrepancy Detected on Account ACC-10482-001',
      description: 'Automated EOD reconciliation flagged -₹18,500.00 discrepancy on CASA core ledger.',
      actorId: adminUser.id,
      actorName: 'COREvia EOD Reconciler',
      actorRole: 'SYSTEM',
      createdAt: new Date(now.getTime() - 10 * 3600000),
    },
    {
      eventId: 'OEV-2026-00404',
      eventType: 'APPROVAL_COMPLETED',
      severity: 'INFO',
      sourceModule: 'MAKER_CHECKER',
      customerId: priyaSharma?.id || null,
      relatedEntityType: 'DOCUMENT',
      relatedEntityId: 'DOC-REQ-7102',
      title: 'Document Override Approved by Management',
      description: 'Administrator Vikramaditya Rao authorized HMRC tax return substitution for NRI deposit.',
      actorId: adminUser.id,
      actorName: adminUser.name,
      actorRole: adminUser.role,
      createdAt: new Date(now.getTime() - 4 * 3600000),
    },
    {
      eventId: 'OEV-2026-00405',
      eventType: 'SYSTEM_WARNING',
      severity: 'MEDIUM',
      sourceModule: 'CORE_BANKING_SWITCH',
      customerId: null,
      relatedEntityType: 'SWITCH',
      relatedEntityId: 'UPI-NPCI-01',
      title: 'UPI Gateway Latency Spike Detected',
      description: 'Outward clearing ACK latency increased to 3,840ms on NPCI switch channel 2.',
      actorId: adminUser.id,
      actorName: 'Switch Telemetry Engine',
      actorRole: 'SYSTEM',
      createdAt: new Date(now.getTime() - 1 * 3600000),
    },
  ]);
}
