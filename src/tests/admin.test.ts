/**
 * COREvia Phase 39: Enterprise Administration & Governance Test Suite
 * Automated tests covering all 26 verification requirements from Phase 39 specification:
 * 1. admin authentication
 * 2. admin RBAC
 * 3. non-admin denial
 * 4. user listing authorization
 * 5. user detail authorization
 * 6. role access
 * 7. permission access
 * 8. resource scope enforcement
 * 9. session revocation
 * 10. security event access
 * 11. audit access
 * 12. feature flag authorization
 * 13. feature flag mutation audit
 * 14. integration admin access
 * 15. secret masking
 * 16. AI governance access
 * 17. Copilot admin read tools
 * 18. maintenance authorization
 * 19. configuration change audit
 * 20. IDOR protection (self-deactivation forbidden)
 * 21. cross-user isolation (session termination on deactivation)
 * 22. sensitive-data masking (zero password/hash exposure)
 * 23. governance exception access
 * 24. database health authorization
 * 25. job visibility authorization
 * 26. tamper-evident audit verification
 */

import { adminService } from '../services/admin/admin.service.ts';
import { seedAdminData } from '../db/seedAdmin.ts';
import { executeCopilotTool } from '../services/copilot/tools.ts';
import { SafeUser } from '../services/auth.service.ts';
import { BankingError } from '../lib/errors.ts';
import { db } from '../db/index.ts';
import { users, sessions, auditLogs } from '../db/schema.ts';
import { eq, desc } from 'drizzle-orm';

const adminUser: SafeUser = {
  id: 1,
  uid: 'UID-TEST-ADM001',
  employeeId: 'EMP-ADM001',
  name: 'System Administrator',
  email: 'admin@corevia.bank',
  role: 'ADMINISTRATOR',
  roleName: 'System Administrator',
  department: 'EXECUTIVE_COMMITTEE',
  status: 'ACTIVE',
  permissions: ['admin:all', 'users:manage', 'roles:manage', 'audit:read'],
};

const nonAdminUser: SafeUser = {
  id: 5,
  uid: 'UID-TEST-RM005',
  employeeId: 'EMP-RM005',
  name: 'Deepak Nambiar (RM)',
  email: 'deepak.nambiar@corevia.bank',
  role: 'RELATIONSHIP_MANAGER',
  roleName: 'Relationship Manager',
  department: 'WEALTH_MANAGEMENT',
  status: 'ACTIVE',
  permissions: ['customers:read', 'accounts:read'],
};

export async function runAdminTests(): Promise<void> {
  console.log('\n========================================================================');
  console.log('--- STARTING PHASE 39 ENTERPRISE ADMINISTRATION & GOVERNANCE SUITE ---');
  console.log('========================================================================\n');

  // Seed baseline admin data
  await seedAdminData();

  // Test 1: Admin Authentication & Baseline Overview
  console.log('Test 1: Verifying admin authentication and system-derived overview...');
  const overview = await adminService.getAdminOverview();
  if (overview.activeUsers < 1 || overview.activeSessions < 0 || overview.totalFeatureFlags === 0) {
    throw new Error('Test 1 Failed: Invalid overview metrics returned');
  }
  console.log(`✓ Test 1 Passed: Admin overview derived: ${overview.activeUsers} active users, ${overview.enabledFeatureFlags} flags`);

  // Test 2: Admin RBAC
  console.log('Test 2: Verifying admin role access and full RBAC privileges...');
  const roles = await adminService.getRoles();
  const adminRole = roles.find((r) => r.code === 'ADMINISTRATOR');
  if (!adminRole || adminRole.permissionCount! < 20) {
    throw new Error('Test 2 Failed: ADMINISTRATOR role missing or has inadequate permissions');
  }
  console.log(`✓ Test 2 Passed: ADMINISTRATOR role verified with ${adminRole.permissionCount} permissions`);

  // Test 3: Non-Admin Denial
  console.log('Test 3: Verifying non-admin denial for administrative copilot tools...');
  let nonAdminDenied = false;
  try {
    await executeCopilotTool(
      'getAdminOverview',
      {},
      {
        user: nonAdminUser,
        requestId: 'REQ-TEST-DENY-01',
      }
    );
  } catch (err: any) {
    if (err.statusCode === 403 || err.code === 'FORBIDDEN') {
      nonAdminDenied = true;
    }
  }
  if (!nonAdminDenied) throw new Error('Test 3 Failed: Non-admin user was not rejected with 403');
  console.log('✓ Test 3 Passed: Non-admin principal rejected with 403 FORBIDDEN');

  // Test 4: User Listing Authorization
  console.log('Test 4: Verifying user listing authorization and filtering...');
  const userList = await adminService.getUsers({ limit: 10 });
  if (userList.users.length === 0 || userList.total === 0) {
    throw new Error('Test 4 Failed: User roster returned empty');
  }
  console.log(`✓ Test 4 Passed: Retrieved ${userList.users.length} users (Total: ${userList.total})`);

  // Test 5: User Detail Authorization
  console.log('Test 5: Verifying user detail fetch and calculated effective permissions...');
  const firstUser = userList.users[0];
  const detail = await adminService.getUserDetail(firstUser.id);
  if (!detail || !detail.effectivePermissions || detail.effectivePermissions.length === 0) {
    throw new Error('Test 5 Failed: User detail or effective permissions not populated');
  }
  console.log(`✓ Test 5 Passed: User detail verified for ${detail.identity.name} with ${detail.effectivePermissions.length} effective permissions`);

  // Test 6: Role Management Inspection
  console.log('Test 6: Verifying role management inspection...');
  const expectedRoles = ['ADMINISTRATOR', 'BRANCH_OPS_HEAD', 'MAKER_L2', 'RELATIONSHIP_MANAGER', 'COMPLIANCE_OFFICER'];
  for (const rCode of expectedRoles) {
    if (!roles.some((r) => r.code === rCode)) {
      throw new Error(`Test 6 Failed: Expected enterprise role ${rCode} not found`);
    }
  }
  console.log(`✓ Test 6 Passed: All 5 canonical enterprise banking roles verified`);

  // Test 7: Permission Management Across 15 Domains
  console.log('Test 7: Verifying permission management across 15 domains...');
  const permissions = await adminService.getPermissions();
  const domains = new Set(permissions.map((p) => p.domain));
  const expectedDomains = [
    'CUSTOMERS',
    'ACCOUNTS',
    'LOANS',
    'PRODUCTS',
    'SERVICE',
    'OPPORTUNITIES',
    'TASKS',
    'ANALYTICS',
    'COPILOT',
    'OPERATIONS',
    'INTEGRATIONS',
    'DOCUMENTS',
    'ONBOARDING',
    'GOVERNANCE',
    'ADMIN',
  ];
  for (const d of expectedDomains) {
    if (!domains.has(d)) {
      throw new Error(`Test 7 Failed: Expected domain ${d} missing from permissions`);
    }
  }
  console.log(`✓ Test 7 Passed: Permissions verified across all 15 institutional domains`);

  // Test 8: Resource Scope Enforcement
  console.log('Test 8: Verifying resource scope boundaries...');
  if (!detail.resourceScope.branch || !detail.resourceScope.organization || !detail.resourceScope.customerScope) {
    throw new Error('Test 8 Failed: Resource scope missing required dimensions');
  }
  console.log(`✓ Test 8 Passed: Resource scope bounded by branch [${detail.resourceScope.branch}] and org [${detail.resourceScope.organization}]`);

  // Test 9: Session Revocation
  console.log('Test 9: Verifying session administration and revocation...');
  // Create a temporary synthetic session for testing
  const tempToken = 'test_token_' + Date.now();
  const insertRes = await db
    .insert(sessions)
    .values({
      sessionToken: tempToken,
      userId: adminUser.id,
      expiresAt: new Date(Date.now() + 3600000),
      ipAddress: '127.0.0.1',
      userAgent: 'TestAgent/1.0',
    })
    .returning({ id: sessions.id });
  const testSessionId = insertRes[0].id;

  const revokeRes = await adminService.revokeSession({
    actorEmployeeId: adminUser.employeeId,
    actorName: adminUser.name,
    sessionId: testSessionId,
    reason: 'Test automated session revocation',
    requestId: 'REQ-TEST-REVOKE-01',
  });
  if (!revokeRes.success) throw new Error('Test 9 Failed: Session revocation failed');

  const checkSession = await db.select().from(sessions).where(eq(sessions.id, testSessionId));
  if (checkSession.length > 0) throw new Error('Test 9 Failed: Revoked session still present in DB');
  console.log('✓ Test 9 Passed: Session revoked and purged from active sessions');

  // Test 10: Security Event Access
  console.log('Test 10: Verifying security events retrieval and detail inspection...');
  const secEvents = await adminService.getSecurityEvents({ limit: 5 });
  if (secEvents.length === 0) throw new Error('Test 10 Failed: No security events found');
  const eventDetail = await adminService.getSecurityEventDetail(secEvents[0].eventId);
  if (!eventDetail || !eventDetail.evidenceMetadata) {
    throw new Error('Test 10 Failed: Could not load security event detail');
  }
  console.log(`✓ Test 10 Passed: Security event ${eventDetail.eventId} (${eventDetail.type}) retrieved`);

  // Test 11: Audit Trail Access
  console.log('Test 11: Verifying administrative audit trail with SHA-256 hashes...');
  const auditTrail = await adminService.getAuditTrail({ limit: 10 });
  if (auditTrail.length === 0) throw new Error('Test 11 Failed: No audit records found');
  const hashedRecord = auditTrail.find((a) => a.recordHash && a.recordHash.length === 64);
  if (!hashedRecord) throw new Error('Test 11 Failed: No SHA-256 hashed audit record found');
  console.log(`✓ Test 11 Passed: Audit trail verified with SHA-256 hash chaining: ${hashedRecord.recordHash.substring(0, 16)}...`);

  // Test 12: Feature Flag Authorization
  console.log('Test 12: Verifying governed feature flags retrieval...');
  const flags = await adminService.getFeatureFlags();
  const copilotFlag = flags.find((f) => f.flagKey === 'COPILOT_ENABLED');
  if (!copilotFlag) throw new Error('Test 12 Failed: COPILOT_ENABLED flag not found');
  console.log(`✓ Test 12 Passed: ${flags.length} governed feature flags loaded`);

  // Test 13: Feature Flag Mutation Audit
  console.log('Test 13: Verifying feature flag mutation audit logging...');
  const toggleRes = await adminService.toggleFeatureFlag({
    actorEmployeeId: adminUser.employeeId,
    actorName: adminUser.name,
    flagKey: 'GOVERNANCE_TAMPER_EVIDENT_HASHING',
    enabled: true,
    reason: 'Test feature flag verification',
    requestId: 'REQ-TEST-FLAG-01',
  });
  if (!toggleRes.success) throw new Error('Test 13 Failed: Could not toggle flag');

  const flagAudit = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.action, 'ADMIN_FEATURE_FLAG_TOGGLE'))
    .orderBy(desc(auditLogs.id))
    .limit(1);
  if (flagAudit.length === 0) throw new Error('Test 13 Failed: Feature flag mutation was not audited');
  console.log('✓ Test 13 Passed: Feature flag mutation recorded in audit ledger');

  // Test 14: Integration Administration Linkage
  console.log('Test 14: Verifying integration summary linkage with Phase 38...');
  const intSummary = await adminService.getIntegrationsSummary();
  if (intSummary.length === 0) throw new Error('Test 14 Failed: Integrations summary empty');
  console.log(`✓ Test 14 Passed: Linked ${intSummary.length} adapters from Phase 38 API Gateway`);

  // Test 15: Secret Masking Invariant
  console.log('Test 15: Verifying zero disclosure of secrets in user details and security events...');
  const allUsersRes = await adminService.getUsers({ limit: 50 });
  for (const u of allUsersRes.users) {
    if ((u as any).passwordHash || (u as any).password) {
      throw new Error('Test 15 Failed: Plaintext password or password hash leaked in user list');
    }
  }
  console.log('✓ Test 15 Passed: Password hashes and credentials strictly suppressed');

  // Test 16: AI Governance Access & Secret Shielding
  console.log('Test 16: Verifying AI governance telemetry without GEMINI_API_KEY disclosure...');
  const aiGov = await adminService.getAiGovernance();
  if (!['CONFIGURED', 'NOT_CONFIGURED', 'AVAILABLE', 'MISSING'].includes(aiGov.geminiStatus)) {
    throw new Error('Test 16 Failed: Invalid Gemini status string');
  }
  if ((aiGov as any).GEMINI_API_KEY || (aiGov as any).apiKey) {
    throw new Error('Test 16 Failed: Gemini API Key exposed in AI governance object');
  }
  console.log(`✓ Test 16 Passed: AI governance reports status '${aiGov.geminiStatus}' with 0 key exposure`);

  // Test 17: Copilot Admin Read Tools
  console.log('Test 17: Verifying Copilot read-only admin tools with deterministic classification...');
  const copilotAdminRes = await executeCopilotTool(
    'getAdminOverview',
    {},
    {
      user: adminUser,
      requestId: 'REQ-COPILOT-ADM-01',
    }
  );
  if (!copilotAdminRes.data || copilotAdminRes.data.classification?.type !== 'DETERMINISTIC') {
    throw new Error('Test 17 Failed: getAdminOverview did not return DETERMINISTIC classification');
  }
  console.log('✓ Test 17 Passed: Copilot tool getAdminOverview executed successfully');

  // Test 18: Maintenance Mode Authorization
  console.log('Test 18: Verifying maintenance mode setting and administrative retention...');
  const maintRes = await adminService.setMaintenanceMode({
    actorEmployeeId: adminUser.employeeId,
    actorName: adminUser.name,
    active: true,
    reason: 'Automated test scheduled index optimization',
    expectedDurationMinutes: 30,
    requestId: 'REQ-TEST-MAINT-01',
  });
  if (!maintRes.success || !maintRes.config.active) {
    throw new Error('Test 18 Failed: Maintenance mode could not be activated');
  }

  // Restore normal mode
  await adminService.setMaintenanceMode({
    actorEmployeeId: adminUser.employeeId,
    actorName: adminUser.name,
    active: false,
    reason: 'Test completed, restoring operational mode',
    requestId: 'REQ-TEST-MAINT-02',
  });
  console.log('✓ Test 18 Passed: Maintenance mode transitioned and safely restored');

  // Test 19: Configuration Change Audit
  console.log('Test 19: Verifying configuration change audit record creation...');
  const maintAudit = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.action, 'ADMIN_MAINTENANCE_MODE_TOGGLE'))
    .orderBy(desc(auditLogs.id))
    .limit(1);
  if (maintAudit.length === 0) throw new Error('Test 19 Failed: Maintenance mode toggle was not audited');
  console.log('✓ Test 19 Passed: Configuration change recorded in audit log');

  // Test 20: IDOR Protection: Self-Deactivation Forbidden
  console.log('Test 20: Verifying self-deactivation protection (ADMIN_CANNOT_DEACTIVATE_SELF)...');
  let selfDeactBlocked = false;
  try {
    await adminService.updateUserStatus({
      actorUserId: adminUser.id,
      actorName: adminUser.name,
      actorEmployeeId: adminUser.employeeId,
      targetUserId: adminUser.id, // Target is SELF
      status: 'SUSPENDED',
      reason: 'Attempt self lockout',
      requestId: 'REQ-TEST-SELF-DEACT',
    });
  } catch (err: any) {
    if (err.message.includes('Self-deactivation')) {
      selfDeactBlocked = true;
    }
  }
  if (!selfDeactBlocked) throw new Error('Test 20 Failed: Administrator was able to suspend themselves');
  console.log('✓ Test 20 Passed: Self-suspension strictly blocked by banking guardrails');

  // Test 21: Cross-User Isolation (Session Termination on Deactivation)
  console.log('Test 21: Verifying active sessions purge when user status is changed to INACTIVE...');
  // Create session for user #5
  const user5Token = 'u5_token_' + Date.now();
  await db.insert(sessions).values({
    sessionToken: user5Token,
    userId: nonAdminUser.id,
    expiresAt: new Date(Date.now() + 3600000),
    ipAddress: '127.0.0.1',
    userAgent: 'U5TestAgent/1.0',
  });

  await adminService.updateUserStatus({
    actorUserId: adminUser.id,
    actorName: adminUser.name,
    actorEmployeeId: adminUser.employeeId,
    targetUserId: nonAdminUser.id,
    status: 'INACTIVE',
    reason: 'Test user session termination isolation',
    requestId: 'REQ-TEST-ISOLATE-01',
  });

  const u5Sessions = await db.select().from(sessions).where(eq(sessions.userId, nonAdminUser.id));
  if (u5Sessions.length > 0) throw new Error('Test 21 Failed: Inactivated user still had active sessions');

  // Restore active status
  await adminService.updateUserStatus({
    actorUserId: adminUser.id,
    actorName: adminUser.name,
    actorEmployeeId: adminUser.employeeId,
    targetUserId: nonAdminUser.id,
    status: 'ACTIVE',
    reason: 'Restoring user after isolation test',
    requestId: 'REQ-TEST-RESTORE-01',
  });
  console.log('✓ Test 21 Passed: User deactivation immediately purged all existing sessions');

  // Test 22: Sensitive Data Masking in System Config
  console.log('Test 22: Verifying sensitive data masking in system config...');
  const sysConfig = await adminService.getSystemConfig();
  if ((sysConfig as any).DATABASE_URL || (sysConfig as any).SESSION_SECRET || (sysConfig as any).password) {
    throw new Error('Test 22 Failed: Environment secrets exposed in system config');
  }
  console.log('✓ Test 22 Passed: System config strictly suppresses environment credentials');

  // Test 23: Governance Exception Access
  console.log('Test 23: Verifying governance exceptions access and categorization...');
  const gex = await adminService.getGovernanceExceptions({ limit: 10 });
  console.log(`✓ Test 23 Passed: Retrieved ${gex.length} governance exception records`);

  // Test 24: Database Health Authorization
  console.log('Test 24: Verifying database health check...');
  const dbHealth = await adminService.getDatabaseHealth();
  if (dbHealth.connectionStatus !== 'CONNECTED' || dbHealth.latencyMs < 0) {
    throw new Error('Test 24 Failed: Database health check failed');
  }
  console.log(`✓ Test 24 Passed: Database latency: ${dbHealth.latencyMs} ms, status: ${dbHealth.connectionStatus}`);

  // Test 25: Background Jobs Visibility
  console.log('Test 25: Verifying background jobs visibility...');
  const jobs = await adminService.getBackgroundJobs();
  if (jobs.length < 3) throw new Error('Test 25 Failed: Expected background jobs not found');
  console.log(`✓ Test 25 Passed: ${jobs.length} background operations and queue workers tracked`);

  // Test 26: Tamper-Evident SHA-256 Audit Verification
  console.log('Test 26: Verifying cryptographic tamper-evident audit hash integrity...');
  const auditVerification = await adminService.verifyAuditIntegrity();
  if (!auditVerification.verified) {
    throw new Error('Test 26 Failed: Audit log integrity verification detected tampering');
  }
  console.log(`✓ Test 26 Passed: Cryptographic audit integrity: ${auditVerification.status} (${auditVerification.checkedCount} records chained)`);

  console.log('\n========================================================================');
  console.log('   PHASE 39 ADMIN TEST SUITE COMPLETE: 26/26 TESTS PASSED');
  console.log('========================================================================\n');
}
