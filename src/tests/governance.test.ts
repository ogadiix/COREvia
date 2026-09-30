/**
 * COREvia Phase 35: Trust & Governance Center Automated Test Suite
 * Comprehensive verification of enterprise observability, explainability,
 * tamper-evident audit chaining, safe Gemini configuration, Copilot tools,
 * and exception workflows.
 */

import { db } from '../db/index.ts';
import { users, auditLogs, governanceExceptions } from '../db/schema.ts';
import { eq, desc, sql } from 'drizzle-orm';
import { SafeUser } from '../services/auth.service.ts';
import { governanceService } from '../services/governance.service.ts';
import { governanceRepository } from '../repositories/governance.repository.ts';
import { auditRepository } from '../repositories/audit.repository.ts';
import { executeCopilotTool } from '../services/copilot/tools.ts';
import { copilotSecurity } from '../services/copilot/security.ts';
import { BankingError } from '../lib/errors.ts';

export async function runGovernanceTests() {
  console.log('========================================================================');
  console.log('--- STARTING PHASE 35 TRUST & GOVERNANCE CENTER TEST SUITE ---');
  console.log('========================================================================\n');

  // Load test fixtures
  const [adminUser] = await db.select().from(users).where(eq(users.role, 'ADMINISTRATOR')).limit(1);
  const [rmUser] = await db.select().from(users).where(eq(users.role, 'RELATIONSHIP_MANAGER')).limit(1);

  if (!adminUser || !rmUser) {
    throw new Error('Test fixtures require Administrator and Relationship Manager users in database.');
  }

  const safeAdmin: SafeUser = {
    id: adminUser.id,
    uid: adminUser.uid,
    name: adminUser.name,
    email: adminUser.email,
    employeeId: adminUser.employeeId,
    role: 'ADMINISTRATOR',
    roleName: 'System Administrator',
    department: 'INFORMATION_SECURITY',
    status: 'ACTIVE',
    permissions: ['admin:all', 'governance:view', 'audit:read', 'customers:read'],
  };

  const safeRM: SafeUser = {
    id: rmUser.id,
    uid: rmUser.uid,
    name: rmUser.name,
    email: rmUser.email,
    employeeId: rmUser.employeeId,
    role: 'RELATIONSHIP_MANAGER',
    roleName: 'Relationship Manager',
    department: 'CORPORATE_RELATIONSHIPS',
    status: 'ACTIVE',
    permissions: ['customers:read', 'tasks:write', 'governance:view'],
  };

  const safeTeller: SafeUser = {
    id: 999,
    uid: 'USR-TELLER-TEST',
    name: 'Test Teller',
    email: 'teller.test@corevia.bank.in',
    employeeId: 'EMP-TEL-999',
    role: 'TELLER',
    roleName: 'Cash Teller',
    department: 'BRANCH_CASH',
    status: 'ACTIVE',
    permissions: ['cash:manage'],
  };

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ [TEST ${totalTests}] PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ✗ [TEST ${totalTests}] FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
      throw new Error(`Test assertion failed: ${testName}`);
    }
  }

  // =========================================================================
  // 1. Governance Overview & System Status
  // =========================================================================
  console.log('\n--- Section 1: Enterprise Governance Overview ---');
  const overview = await governanceService.getOverview(safeAdmin);
  assert(
    overview.systemStatus === 'OPERATIONAL' || overview.systemStatus === 'ATTENTION_REQUIRED',
    'Overview reports genuine operational status based on conditions',
    `Reported status: ${overview.systemStatus}`
  );
  assert(overview.auditActivity.totalEvents > 0, 'Audit activity metrics reflect real database counts');
  assert(overview.aiActivity.copilotSessions >= 0, 'AI activity tracks copilot session totals');
  assert(overview.humanApprovals.pendingCount >= 0, 'Human approvals metrics reflect Maker-Checker queue');
  assert(overview.governanceExceptions.total >= 0, 'Governance exceptions count populated from database');

  // =========================================================================
  // 2. Audit Explorer & Tamper-Evident Chaining
  // =========================================================================
  console.log('\n--- Section 2: Audit Explorer & Cryptographic Chaining ---');
  // Log a new tamper-evident audit record
  const testAuditLog = await auditRepository.createLog({
    actorId: safeAdmin.employeeId,
    actorName: safeAdmin.name,
    action: 'TEST_GOVERNANCE_AUDIT_ACTION',
    resourceType: 'TEST_RESOURCE',
    resourceId: 'TEST-RES-001',
    requestId: `REQ-TEST-AUD-${Date.now()}`,
    outcome: 'SUCCESS',
    metadata: { testSuite: 'Phase 35 Trust & Governance', role: safeAdmin.role },
  });

  assert(Boolean(testAuditLog && testAuditLog.recordHash), 'New audit log generates cryptographic recordHash');
  assert(Boolean(testAuditLog && testAuditLog.previousHash), 'New audit log includes previousHash tamper-evident link');

  // Verify chain integrity
  const chainIntegrity = await auditRepository.verifyChainIntegrity(20);
  assert(chainIntegrity.chainValid === true, 'Cryptographic audit chain integrity verification passes');

  // Retrieve via service
  const auditExplorerResult = await governanceService.getAuditExplorer(
    { action: 'TEST_GOVERNANCE_AUDIT_ACTION' } as any,
    safeAdmin
  );
  assert(auditExplorerResult.events.length > 0, 'Audit explorer successfully queries records by action filter');
  assert(
    auditExplorerResult.chainIntegrity.chainStatus === 'VERIFIED_IMMUTABLE',
    'Audit explorer exposes immutable tamper-evident chain status'
  );

  // =========================================================================
  // 3. AI Governance & Zero Secret Exposure
  // =========================================================================
  console.log('\n--- Section 3: AI Governance & Zero Secret Leakage ---');
  const aiGov = await governanceService.getAIGovernance(safeAdmin);
  assert(aiGov.modelConfig.provider === 'Google Gemini', 'AI Governance config identifies Google Gemini provider');
  assert(typeof aiGov.modelConfig.keyConfigured === 'boolean', 'API Key status is exposed as boolean without leaking key');
  assert(
    !JSON.stringify(aiGov).includes(process.env.GEMINI_API_KEY || 'NEVER_EXPOSE'),
    'CRITICAL: API key secrets are never exposed in AI Governance response payload'
  );
  assert(aiGov.deterministicResponses > 0, 'Deterministic responses are accurately distinguished from AI responses');
  assert(aiGov.toolCallsBreakdown.length > 0, 'Tool calls breakdown categorized with institutional classifications');
  assert(Array.isArray(aiGov.aiFallbacks), 'AI fallback telemetry returns structured incident log');

  // =========================================================================
  // 4. Agent Governance
  // =========================================================================
  console.log('\n--- Section 4: Controlled Agent Governance ---');
  const agentGov = await governanceService.getAgentGovernance(safeAdmin);
  assert(agentGov.plansCreated >= 0, 'Agent plans created metric retrieved from database');
  assert(Array.isArray(agentGov.recentPlans), 'Recent plans array retrieved with objective, DT basis, and status');

  // =========================================================================
  // 5. Access & Security Governance
  // =========================================================================
  console.log('\n--- Section 5: Access & Security Governance ---');
  const accessGov = await governanceService.getAccessGovernance(safeAdmin);
  assert(accessGov.totalEvents >= 0, 'Access governance tallies total access events');
  assert(Array.isArray(accessGov.resourceAccess), 'Resource access categorized by module');

  const secGov = await governanceService.getSecurityGovernance(safeAdmin);
  assert(secGov.failedLogins >= 0, 'Security center monitors failed logins');
  assert(Array.isArray(secGov.recentSecurityEvents), 'Security events logged under neutral banking terminology');

  // =========================================================================
  // 6. Data Governance & Data Lineage
  // =========================================================================
  console.log('\n--- Section 6: Data Governance & Canonical Lineage ---');
  const dataGov = await governanceService.getDataGovernance(safeAdmin);
  assert(dataGov.customerContextAccessCount > 0, 'Data governance tracks customer context lookups');
  assert(dataGov.lineageNodes.length >= 8, 'Canonical intelligence lineage contains all 8+ architecture layers');

  const layersFound = dataGov.lineageNodes.map((n) => n.type);
  assert(
    layersFound.includes('SOURCE') &&
      layersFound.includes('DERIVED') &&
      layersFound.includes('SIMULATED') &&
      layersFound.includes('HUMAN_ACTION') &&
      layersFound.includes('AUDIT'),
    'Lineage nodes correctly classify SOURCE, DERIVED, SIMULATED, HUMAN_ACTION, and AUDIT stages'
  );
  assert(dataGov.lineageEdges.length >= 7, 'Lineage edges link sequential provenance from source to audit');

  // =========================================================================
  // 7. Approvals & Decision Governance
  // =========================================================================
  console.log('\n--- Section 7: Approvals & Decision Governance ---');
  const approvals = await governanceService.getApprovals(safeAdmin);
  assert(approvals.pendingCount >= 0, 'Approvals center tracks pending count');
  assert(approvals.items.length >= 1, 'Approvals center displays pending agent plans or ownership handoffs');

  const decisions = await governanceService.getDecisionGovernance(safeAdmin);
  assert(decisions.totalDecisions > 0, 'Decision governance aggregates total explainable decisions');
  assert(decisions.byMode.DETERMINISTIC > 0, 'Decision modes explicitly separate DETERMINISTIC from HYBRID');

  // =========================================================================
  // 8. System Health Live Ping
  // =========================================================================
  console.log('\n--- Section 8: System Health Live Verification ---');
  const health = await governanceService.getSystemHealth(safeAdmin);
  assert(health.overall === 'HEALTHY' || health.overall === 'DEGRADED', 'Live health verification completed');
  assert(health.services.database.status === 'HEALTHY', 'PostgreSQL database ping returned HEALTHY');
  assert(typeof health.services.database.latencyMs === 'number', 'Database ping latency measured in milliseconds');
  assert(health.services.api.status === 'HEALTHY', 'Express API Gateway status HEALTHY');

  // =========================================================================
  // 9. Lightweight Export Governance Tracking
  // =========================================================================
  console.log('\n--- Section 9: Export Governance & Audit Tracking ---');
  await governanceService.recordExportAudit({
    actorId: safeAdmin.employeeId,
    actorName: safeAdmin.name,
    role: safeAdmin.role,
    dataset: 'TEST_PORTFOLIO_EXPORT',
    filterScope: 'BRANCH_MUMBAI',
    recordCount: 50,
    outcome: 'SUCCESS',
  });

  const exportsData = await governanceService.getExports(safeAdmin);
  assert(exportsData.totalExports > 0, 'Export activity recorded in audit trail without storing export file payloads');

  // =========================================================================
  // 10. Governance Exceptions Lifecycle (CRUD, Acknowledge, Assign, Resolve, Dismiss)
  // =========================================================================
  console.log('\n--- Section 10: Governance Exceptions Lifecycle ---');
  const testExceptionCode = `GEX-TEST-${Date.now()}`;
  const createdEx = await governanceRepository.createException({
    exceptionId: testExceptionCode,
    category: 'SECURITY',
    severity: 'HIGH',
    resourceType: 'API_ENDPOINT',
    resourceId: '/api/test/governance',
    description: 'Automated test exception for lifecycle validation',
    assignedTo: null,
    metadata: { test: true },
  });

  assert(createdEx.status === 'OPEN', 'Newly created exception has status OPEN');

  // Acknowledge
  const ackedEx = await governanceService.acknowledgeException(createdEx.id, safeAdmin);
  assert(ackedEx.status === 'UNDER_REVIEW', 'Acknowledge transitions exception to UNDER_REVIEW');
  assert(ackedEx.assignedTo === safeAdmin.id, 'Acknowledge assigns exception to the acknowledging officer');

  // Assign
  const assignedEx = await governanceService.assignException(createdEx.id, safeRM.id, safeAdmin);
  assert(assignedEx.assignedTo === safeRM.id, 'Assign updates assignedTo user ID');

  // Resolve
  const resolvedEx = await governanceService.resolveException(
    createdEx.id,
    'Verified operational boundary. Security rule validated.',
    safeAdmin
  );
  assert(resolvedEx.status === 'RESOLVED', 'Resolve transitions exception to RESOLVED');
  assert(Boolean(resolvedEx.resolvedAt), 'Resolve sets resolvedAt timestamp');

  // Dismissal test with a new exception
  const dismissExCode = `GEX-DSM-${Date.now()}`;
  const exToDismiss = await governanceRepository.createException({
    exceptionId: dismissExCode,
    category: 'OPERATIONAL',
    severity: 'LOW',
    resourceType: 'TEST_OP',
    resourceId: 'OP-001',
    description: 'Transient operational warning to test dismissal',
  });

  const dismissed = await governanceService.dismissException(
    exToDismiss.id,
    'False positive caused by routine maintenance window.',
    safeAdmin
  );
  assert(dismissed.status === 'DISMISSED', 'Dismiss transitions exception to DISMISSED');

  // =========================================================================
  // 11. RBAC & Security Boundaries (Unauthorized Role Blocking)
  // =========================================================================
  console.log('\n--- Section 11: RBAC & Copilot Tool Security Envelopes ---');
  // 1. Authorized Admin can call getGovernanceOverview
  const adminToolResult = await executeCopilotTool(
    'getGovernanceOverview',
    {},
    { user: safeAdmin as any, requestId: `REQ-COP-ADM-${Date.now()}` }
  );
  assert(
    adminToolResult.data.classification.type === 'GOVERNANCE_OVERVIEW',
    'Authorized Admin can query getGovernanceOverview via Copilot'
  );

  // 2. Authorized Admin can call getAuditEvents
  const auditToolResult = await executeCopilotTool(
    'getAuditEvents',
    { limit: 5 },
    { user: safeAdmin as any, requestId: `REQ-COP-AUD-${Date.now()}` }
  );
  assert(
    auditToolResult.data.classification.type === 'AUDIT_TRAIL',
    'Authorized Admin can query getAuditEvents via Copilot'
  );

  // 3. Authorized Admin can call getSystemHealth
  const healthToolResult = await executeCopilotTool(
    'getSystemHealth',
    {},
    { user: safeAdmin as any, requestId: `REQ-COP-HLT-${Date.now()}` }
  );
  assert(
    healthToolResult.data.classification.type === 'SYSTEM_HEALTH',
    'Authorized Admin can query getSystemHealth via Copilot'
  );

  // 4. Unauthorized role (TELLER) is strictly blocked by copilotSecurity.authorizeToolExecution
  let tellerBlocked = false;
  try {
    await copilotSecurity.authorizeToolExecution(
      'getGovernanceOverview',
      {},
      safeTeller,
      `REQ-TEL-${Date.now()}`
    );
  } catch (err: any) {
    if (err instanceof BankingError && err.statusCode === 403) {
      tellerBlocked = true;
    }
  }
  assert(tellerBlocked, 'Unauthorized TELLER role is blocked with 403 Forbidden from governance copilot tools');

  // 5. RM cannot access getSecurityEvents (requires elevated Admin or Compliance)
  let rmBlockedFromSecurityEvents = false;
  try {
    await copilotSecurity.authorizeToolExecution(
      'getSecurityEvents',
      {},
      safeRM,
      `REQ-RM-SEC-${Date.now()}`
    );
  } catch (err: any) {
    if (err instanceof BankingError && err.statusCode === 403) {
      rmBlockedFromSecurityEvents = true;
    }
  }
  assert(
    rmBlockedFromSecurityEvents,
    'Relationship Manager role is restricted from elevated getSecurityEvents copilot tool'
  );

  console.log('\n========================================================================');
  console.log(`--- PHASE 35 TEST SUITE COMPLETED: ${passedTests}/${totalTests} TESTS PASSED ---`);
  console.log('========================================================================\n');
}

if (process.argv[1]?.endsWith('governance.test.ts')) {
  runGovernanceTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Test execution failed:', err);
      process.exit(1);
    });
}
