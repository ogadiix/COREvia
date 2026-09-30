/**
 * COREvia Phase 35: Trust & Governance Center Seed & DDL
 * Ensures audit_logs has previous_hash and record_hash columns.
 * Auto-creates governance_exceptions table if not present.
 * Seeds realistic synthetic governance exceptions for enterprise observability.
 */

import { db } from './index.ts';
import { sql, eq } from 'drizzle-orm';
import { governanceExceptions } from './schema.ts';

export async function ensureGovernanceTablesExist(): Promise<void> {
  // 1. Ensure tamper-evident chaining columns on audit_logs
  await db.execute(sql`
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS previous_hash TEXT;
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS record_hash TEXT;
    CREATE INDEX IF NOT EXISTS idx_audit_record_hash ON audit_logs(record_hash);
  `);

  // 2. Ensure governance_exceptions table exists
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS governance_exceptions (
      id SERIAL PRIMARY KEY,
      exception_id TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      description TEXT NOT NULL,
      detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL DEFAULT 'OPEN',
      assigned_to TEXT,
      resolved_at TIMESTAMP,
      resolution TEXT,
      metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_gov_exceptions_status ON governance_exceptions(status);
    CREATE INDEX IF NOT EXISTS idx_gov_exceptions_category ON governance_exceptions(category);
    CREATE INDEX IF NOT EXISTS idx_gov_exceptions_severity ON governance_exceptions(severity);
    CREATE INDEX IF NOT EXISTS idx_gov_exceptions_resource ON governance_exceptions(resource_type, resource_id);
    CREATE INDEX IF NOT EXISTS idx_gov_exceptions_assigned ON governance_exceptions(assigned_to);
  `);
}

export async function seedGovernanceExceptions(): Promise<void> {
  await ensureGovernanceTablesExist();

  const existing = await db.select().from(governanceExceptions).limit(1);
  if (existing.length > 0) {
    return;
  }

  const syntheticExceptions = [
    {
      exceptionId: 'GEX-2026-00101',
      category: 'SECURITY',
      severity: 'HIGH',
      resourceType: 'USER',
      resourceId: 'USR-TELLER-09',
      description: 'Repeated authorization failure: Multiple 403 Forbidden events on customer KYC document bulk download endpoint within 5 minutes',
      detectedAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
      status: 'OPEN',
      assignedTo: 'rohit.kulkarni@corevia.bank.in',
      metadata: {
        attemptCount: 4,
        sourceIp: '10.14.20.108',
        requestedEndpoint: '/api/documents/bulk-export',
        deniedPermission: 'DOCUMENTS_BULK_EXPORT',
        environment: 'SYNTHETIC ENVIRONMENT'
      },
    },
    {
      exceptionId: 'GEX-2026-00102',
      category: 'AGENT',
      severity: 'MEDIUM',
      resourceType: 'AGENT_PLAN',
      resourceId: 'PLN-20260929-00104',
      description: 'Agent plan step execution partial failure: Opportunity stage changed in CRM concurrently during approval window',
      detectedAt: new Date(Date.now() - 3600000 * 5), // 5 hours ago
      status: 'UNDER_REVIEW',
      assignedTo: 'priya.deshmukh@corevia.bank.in',
      metadata: {
        planTitle: 'Sharma Family Multi-Product Relationship Recovery',
        customerId: 'CUS-10482',
        failedStepIndex: 3,
        stepAction: 'OPPORTUNITY_UPDATE',
        resolutionNote: 'Awaiting RM reconciliation with client before re-triggering plan execution',
        environment: 'SYNTHETIC ENVIRONMENT'
      },
    },
    {
      exceptionId: 'GEX-2026-00103',
      category: 'AI',
      severity: 'LOW',
      resourceType: 'COPILOT',
      resourceId: 'COP-SESSION-2026-0922',
      description: 'Gemini inference latency exceeded 4000ms: Institutional deterministic fallback engine activated automatically',
      detectedAt: new Date(Date.now() - 3600000 * 12), // 12 hours ago
      status: 'RESOLVED',
      assignedTo: 'rohit.kulkarni@corevia.bank.in',
      resolvedAt: new Date(Date.now() - 3600000 * 10),
      resolution: 'Deterministic rules returned verified RBI regulatory guidance. Fallback telemetry verified normal operation.',
      metadata: {
        modelConfigured: 'gemini-2.5-flash',
        fallbackEngine: 'institutional_engine',
        queryType: 'CRR_SLR_INQUIRY',
        latencyMs: 4120,
        environment: 'SYNTHETIC ENVIRONMENT'
      },
    },
    {
      exceptionId: 'GEX-2026-00104',
      category: 'DATA',
      severity: 'INFO',
      resourceType: 'EXPORT',
      resourceId: 'EXP-2026-0930-884',
      description: 'Large dataset export initiated: High-Net-Worth customer portfolio summary downloaded by authorized Compliance Auditor',
      detectedAt: new Date(Date.now() - 3600000 * 20),
      status: 'RESOLVED',
      assignedTo: 1,
      resolvedAt: new Date(Date.now() - 3600000 * 19),
      resolution: 'Verified quarterly statutory compliance audit requirement. Access logged and encrypted.',
      metadata: {
        exportFormat: 'CSV',
        recordCount: 142,
        auditedBy: 'AUDIT_LOGGING_SERVICE',
        environment: 'SYNTHETIC ENVIRONMENT',
        assignedEmail: 'aditya.bansal@corevia.bank.in'
      }
    }
  ];

  for (const ex of syntheticExceptions) {
    await db.insert(governanceExceptions).values({
      exceptionId: ex.exceptionId,
      category: ex.category as any,
      severity: ex.severity as any,
      resourceType: ex.resourceType,
      resourceId: ex.resourceId,
      description: ex.description,
      detectedAt: ex.detectedAt,
      status: ex.status as any,
      assignedTo: typeof ex.assignedTo === 'number' ? ex.assignedTo : null,
      resolvedAt: ex.resolvedAt,
      resolution: ex.resolution,
      metadata: ex.metadata,
    });
  }
}
