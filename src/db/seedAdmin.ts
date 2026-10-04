/**
 * COREvia Phase 39: Enterprise Administration & Governance Seed & DDL
 * Ensures admin tables (feature_flags, security_events, system_settings) and indexes exist.
 * Seeds initial governed feature flags, synthetic security events, and baseline system settings.
 */

import { db } from './index.ts';
import { sql } from 'drizzle-orm';

export async function ensureAdminTablesExist(): Promise<void> {
  // 1. feature_flags
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS feature_flags (
      id SERIAL PRIMARY KEY,
      flag_key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT FALSE,
      environment TEXT NOT NULL DEFAULT 'ALL',
      rollout_scope TEXT NOT NULL DEFAULT 'ALL',
      owner TEXT NOT NULL DEFAULT 'SYSTEM_ADMIN',
      metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_ff_flag_key ON feature_flags(flag_key);
    CREATE INDEX IF NOT EXISTS idx_ff_enabled ON feature_flags(enabled);
  `);

  // 2. security_events
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS security_events (
      id SERIAL PRIMARY KEY,
      event_id TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'MEDIUM',
      actor_id TEXT,
      actor_name TEXT,
      target_resource TEXT NOT NULL,
      request_id TEXT,
      source_ip TEXT DEFAULT '127.0.0.1',
      source TEXT NOT NULL DEFAULT 'COREvia Security Guard',
      outcome TEXT NOT NULL DEFAULT 'BLOCKED',
      evidence_metadata JSONB,
      timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_sec_event_id ON security_events(event_id);
    CREATE INDEX IF NOT EXISTS idx_sec_type ON security_events(type);
    CREATE INDEX IF NOT EXISTS idx_sec_severity ON security_events(severity);
    CREATE INDEX IF NOT EXISTS idx_sec_actor_id ON security_events(actor_id);
    CREATE INDEX IF NOT EXISTS idx_sec_timestamp ON security_events(timestamp);
  `);

  // 3. system_settings
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS system_settings (
      id SERIAL PRIMARY KEY,
      setting_key TEXT NOT NULL UNIQUE,
      setting_value JSONB NOT NULL,
      updated_by TEXT NOT NULL DEFAULT 'SYSTEM',
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_sys_setting_key ON system_settings(setting_key);
  `);
}

export async function seedAdminData(): Promise<void> {
  await ensureAdminTablesExist();

  // 1. Seed Governed Feature Flags
  const flags = [
    {
      flagKey: 'COPILOT_ENABLED',
      name: 'Gemini Banking Copilot',
      description: 'Enables real-time conversational AI copilot and read-only portfolio intelligence tools',
      enabled: true,
      environment: 'ALL',
      rolloutScope: 'ALL',
      owner: 'AI_GOVERNANCE_COMMITTEE',
      metadata: JSON.stringify({ category: 'AI', highRisk: false }),
    },
    {
      flagKey: 'RELATIONSHIP_GRAPH_ENABLED',
      name: 'Corporate Relationship Knowledge Graph',
      description: 'Activates enterprise entity resolution, multi-tier supply chain discovery and graph visualizer',
      enabled: true,
      environment: 'ALL',
      rolloutScope: 'ALL',
      owner: 'RISK_TECHNOLOGY_HEAD',
      metadata: JSON.stringify({ category: 'DATA_VIS', highRisk: false }),
    },
    {
      flagKey: 'OPERATIONS_ENABLED',
      name: 'Enterprise Operations Engine',
      description: 'Activates Phase 36 operations orchestration, maker-checker escalation and queue dispatching',
      enabled: true,
      environment: 'ALL',
      rolloutScope: 'ALL',
      owner: 'HEAD_OF_OPERATIONS',
      metadata: JSON.stringify({ category: 'CORE_OPERATIONS', highRisk: true }),
    },
    {
      flagKey: 'PORTFOLIO_INTELLIGENCE_ENABLED',
      name: 'Institutional Portfolio Intelligence',
      description: 'Enables Phase 37 stress test engines, sector concentration matrices, and covenant tracking',
      enabled: true,
      environment: 'ALL',
      rolloutScope: 'ALL',
      owner: 'CHIEF_RISK_OFFICER',
      metadata: JSON.stringify({ category: 'RISK_ANALYTICS', highRisk: false }),
    },
    {
      flagKey: 'INTEGRATIONS_ENABLED',
      name: 'Enterprise API Gateway & Integration Simulators',
      description: 'Enables Phase 38 enterprise adapter hub, simulated endpoints, webhooks, and circuit breakers',
      enabled: true,
      environment: 'ALL',
      rolloutScope: 'ALL',
      owner: 'CHIEF_INFORMATION_OFFICER',
      metadata: JSON.stringify({ category: 'INTEGRATIONS', highRisk: true }),
    },
    {
      flagKey: 'GOVERNANCE_TAMPER_EVIDENT_HASHING',
      name: 'Audit Tamper-Evident SHA-256 Hash Chaining',
      description: 'Enforces cryptographic previous-hash verification across administrative audit trails',
      enabled: true,
      environment: 'ALL',
      rolloutScope: 'ALL',
      owner: 'HEAD_OF_COMPLIANCE',
      metadata: JSON.stringify({ category: 'SECURITY', highRisk: true }),
    },
    {
      flagKey: 'AUTOMATED_SLA_ESCALATION',
      name: 'Autonomous SLA Breach Escalation Service',
      description: 'Automatically dispatches high-priority notices when operational approvals breach SLA thresholds',
      enabled: true,
      environment: 'ALL',
      rolloutScope: 'ALL',
      owner: 'HEAD_OF_OPERATIONS',
      metadata: JSON.stringify({ category: 'AUTOMATION', highRisk: false }),
    },
  ];

  for (const flag of flags) {
    await db.execute(sql`
      INSERT INTO feature_flags (flag_key, name, description, enabled, environment, rollout_scope, owner, metadata, created_at, updated_at)
      VALUES (
        ${flag.flagKey},
        ${flag.name},
        ${flag.description},
        ${flag.enabled},
        ${flag.environment},
        ${flag.rolloutScope},
        ${flag.owner},
        ${sql.raw(`'${flag.metadata}'::jsonb`)},
        NOW(),
        NOW()
      )
      ON CONFLICT (flag_key) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = NOW();
    `);
  }

  // 2. Seed Baseline System Settings (Maintenance Mode default: inactive)
  const maintenanceModeSetting = JSON.stringify({
    active: false,
    reason: null,
    enabledBy: null,
    startedAt: null,
    expectedEndAt: null,
  });

  await db.execute(sql`
    INSERT INTO system_settings (setting_key, setting_value, updated_by, updated_at, created_at)
    VALUES (
      'MAINTENANCE_MODE',
      ${sql.raw(`'${maintenanceModeSetting}'::jsonb`)},
      'SYSTEM_INIT',
      NOW(),
      NOW()
    )
    ON CONFLICT (setting_key) DO NOTHING;
  `);

  // 3. Seed Realistic Representative Security Events (Idempotently)
  const secEvents = [
    {
      eventId: 'SEC-2026-00101',
      type: 'AUTHORIZATION_FAILURE',
      severity: 'HIGH',
      actorId: 'usr-analyst-09',
      actorName: 'Aditi Sharma (Analyst)',
      targetResource: '/admin/roles/ADMINISTRATOR/permissions',
      requestId: 'req-sec-9011',
      sourceIp: '10.14.22.81',
      source: 'COREvia Authorization Guard',
      outcome: 'DENIED',
      evidenceMetadata: JSON.stringify({
        attemptedAction: 'ROLE_UPDATE',
        requiredPermission: 'ADMIN:MANAGE_ROLES',
        assignedPermissions: ['ANALYTICS:VIEW', 'REPORTS:EXPORT'],
        blockedReason: 'Principal lacks required governance entitlement',
      }),
      timestamp: '2026-09-28 14:22:10',
    },
    {
      eventId: 'SEC-2026-00102',
      type: 'IDOR_ATTEMPT',
      severity: 'CRITICAL',
      actorId: 'usr-branch-33',
      actorName: 'Kunal Verma (Branch Officer)',
      targetResource: '/admin/users/1/sessions',
      requestId: 'req-sec-9012',
      sourceIp: '10.18.5.12',
      source: 'COREvia Resource Guard',
      outcome: 'BLOCKED',
      evidenceMetadata: JSON.stringify({
        attemptedResource: 'SESSION_REVOCATION',
        targetUserId: 1,
        actorUserId: 33,
        violation: 'Cross-user administrative boundary access attempted without SYSTEM_ADMIN role',
      }),
      timestamp: '2026-09-29 09:15:33',
    },
    {
      eventId: 'SEC-2026-00103',
      type: 'AUTH_FAILURE',
      severity: 'MEDIUM',
      actorId: 'ANONYMOUS',
      actorName: 'Unknown',
      targetResource: '/api/auth/login',
      requestId: 'req-sec-9013',
      sourceIp: '192.168.1.105',
      source: 'COREvia Authentication Filter',
      outcome: 'BLOCKED',
      evidenceMetadata: JSON.stringify({
        attemptedEmail: 'sysadmin_backup@internal.bank',
        failureCount: 4,
        policyTriggered: 'MAX_FAILED_ATTEMPTS_WARNING',
      }),
      timestamp: '2026-09-30 11:42:01',
    },
    {
      eventId: 'SEC-2026-00104',
      type: 'SECRET_ACCESS_ATTEMPT',
      severity: 'CRITICAL',
      actorId: 'usr-analyst-09',
      actorName: 'Aditi Sharma (Analyst)',
      targetResource: 'CONFIG:GEMINI_API_KEY',
      requestId: 'req-sec-9014',
      sourceIp: '10.14.22.81',
      source: 'COREvia Secret Vault Guard',
      outcome: 'BLOCKED',
      evidenceMetadata: JSON.stringify({
        attemptedKey: 'GEMINI_API_KEY',
        status: 'PROTECTED_SECRET',
        violation: 'Arbitrary extraction of AI provider credentials denied by strict data minimization',
      }),
      timestamp: '2026-10-01 16:05:19',
    },
    {
      eventId: 'SEC-2026-00105',
      type: 'SUSPICIOUS_SESSION',
      severity: 'HIGH',
      actorId: 'usr-maker-02',
      actorName: 'Pooja Iyer (Maker L2)',
      targetResource: '/api/maker-checker/execute',
      requestId: 'req-sec-9015',
      sourceIp: '185.220.101.4',
      source: 'COREvia Session Anomaly Detector',
      outcome: 'CHALLENGED',
      evidenceMetadata: JSON.stringify({
        reason: 'Unregistered geographic ASN detected for privileged maker role',
        sessionAgeHours: 6.2,
        actionTaken: 'MFA_CHALLENGE_ISSUED',
      }),
      timestamp: '2026-10-02 08:33:45',
    },
  ];

  for (const ev of secEvents) {
    await db.execute(sql`
      INSERT INTO security_events (event_id, type, severity, actor_id, actor_name, target_resource, request_id, source_ip, source, outcome, evidence_metadata, timestamp, created_at)
      VALUES (
        ${ev.eventId},
        ${ev.type},
        ${ev.severity},
        ${ev.actorId},
        ${ev.actorName},
        ${ev.targetResource},
        ${ev.requestId},
        ${ev.sourceIp},
        ${ev.source},
        ${ev.outcome},
        ${sql.raw(`'${ev.evidenceMetadata}'::jsonb`)},
        ${sql.raw(`'${ev.timestamp}'::timestamp`)},
        NOW()
      )
      ON CONFLICT (event_id) DO NOTHING;
    `);
  }
}
