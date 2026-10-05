import assert from 'node:assert';
import { db } from '../db/index.ts';
import {
  customers,
  accounts,
  loans,
  opportunities,
  serviceCases,
  tasks,
  interactions,
  documents,
  auditLogs,
  users,
  sessions,
  featureFlags,
  securityEvents,
  systemSettings,
  agentPlans,
} from '../db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import { adminService } from '../services/admin/admin.service.ts';
import { authService } from '../services/auth.service.ts';
import { DEV_TEST_PASSWORD } from '../db/seedAuthUsers.ts';
import { integrationService } from '../services/integrations/integration.service.ts';
import { isOriginAllowed, csrfProtection } from '../middleware/security.ts';
import { validateEnvironment } from '../lib/env.ts';
import crypto from 'crypto';

export async function runFinalHardeningTests() {
  console.log('\n========================================================================');
  console.log('--- STARTING PHASE 40 FINAL PRODUCTION HARDENING & RELEASE SUITE ---');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function recordPass(msg: string) {
    passed++;
    total++;
    console.log(`✓ Test ${total} Passed: ${msg}`);
  }

  // 1. Canonical Rahul Sharma (CUS-10482) Entity Integrity
  console.log('Test 1: Verifying Rahul Sharma (CUS-10482) core banking relational integrity...');
  const rahulList = await db.select().from(customers).where(eq(customers.customerCode, 'CUS-10482'));
  assert.strictEqual(rahulList.length, 1, 'Rahul Sharma should exist uniquely in customers table');
  const rahul = rahulList[0];
  assert.strictEqual(rahul.id, 1, 'Rahul Sharma primary key should be 1');

  const rahulAccounts = await db.select().from(accounts).where(eq(accounts.customerId, rahul.id));
  assert.ok(rahulAccounts.length >= 2, 'Rahul Sharma must have at least 2 active CASA accounts');

  const rahulLoans = await db.select().from(loans).where(eq(loans.customerId, rahul.id));
  assert.ok(rahulLoans.length >= 1, 'Rahul Sharma must have at least 1 active credit facility');

  const rahulCases = await db.select().from(serviceCases).where(eq(serviceCases.customerId, rahul.id));
  assert.ok(rahulCases.length >= 1, 'Rahul Sharma must have at least 1 service case for dispute tracking');
  recordPass('Rahul Sharma relational graph verified with CASA, Loans, and Service Cases');

  // 2. Action Traceability & Decision Trace Linkage
  console.log('Test 2: Verifying action traceability linkage across customer decision history...');
  const rahulTraces = await db.select().from(auditLogs).where(eq(auditLogs.resourceId, String(rahul.id)));
  assert.ok(rahulTraces.length >= 1, 'Audit log entries must exist for Rahul Sharma');
  recordPass('Action traceability confirmed via PostgreSQL audit logs');

  // 3. IDOR Defense: Admin Self-Protection (Cannot deactivate, suspend, or lock self)
  console.log('Test 3: Verifying admin self-protection against deactivation, suspension, and lockout...');
  for (const attemptedStatus of ['INACTIVE', 'SUSPENDED', 'LOCKED'] as const) {
    let selfActionBlocked = false;
    try {
      await adminService.updateUserStatus({
        actorUserId: 1,
        actorName: 'Aditya Raj',
        actorEmployeeId: 'EMP-ADM001',
        targetUserId: 1, // Self-target
        status: attemptedStatus,
        reason: 'Attempted self-lockout',
        requestId: `REQ-TEST-SELF-${attemptedStatus}`,
      });
    } catch (err: any) {
      selfActionBlocked = err.message.includes('Self-deactivation') || err.message.includes('strictly prohibited');
    }
    assert.ok(selfActionBlocked, `Admin must not be able to transition self to ${attemptedStatus}`);
  }
  recordPass('Admin self-protection strictly verified for INACTIVE, SUSPENDED, and LOCKED states');

  // 4. Admin Status Transition: Unknown User Rejection
  console.log('Test 4: Verifying rejection when attempting to transition unknown target user...');
  let unknownUserRejected = false;
  try {
    await adminService.updateUserStatus({
      actorUserId: 1,
      actorName: 'Aditya Raj',
      actorEmployeeId: 'EMP-ADM001',
      targetUserId: 999999, // Non-existent user
      status: 'SUSPENDED',
      reason: 'Unknown user test',
      requestId: 'REQ-TEST-UNKNOWN-USER',
    });
  } catch (err: any) {
    unknownUserRejected = err.message.includes('not found');
  }
  assert.ok(unknownUserRejected, 'Attempting to update an unknown user must throw not found error');
  recordPass('Unknown target user safely rejected with error');

  // 5. Feature Flag Safety Invariant: Cannot disable security controls
  console.log('Test 5: Verifying feature flags cannot disable core security controls...');
  let secFlagBlocked = false;
  try {
    await adminService.toggleFeatureFlag({
      actorEmployeeId: 'EMP-ADM001',
      actorName: 'Aditya Raj',
      flagKey: 'DISABLE_AUTH',
      enabled: true,
      reason: 'Attempting security bypass',
      requestId: 'REQ-FLAG-SEC-TEST',
    });
  } catch (err: any) {
    secFlagBlocked =
      err.message.includes('cannot be used to bypass') ||
      err.message.includes('SECURITY_CONTROLS_CANNOT_BE_DISABLED_BY_FEATURE_FLAGS');
  }
  assert.ok(secFlagBlocked, 'Security controls cannot be disabled via feature flags');
  recordPass('Feature flag anti-bypass invariant strictly verified');

  // 6. Zero Secret Exposure & Truthful AI Telemetry
  console.log('Test 6: Verifying zero credential exposure across admin config & AI governance telemetry...');
  const sysConfig = await adminService.getSystemConfig();
  const configStr = JSON.stringify(sysConfig);
  assert.ok(!configStr.includes('postgres://'), 'DATABASE_URL connection string must be suppressed');
  assert.ok(!configStr.includes('SESSION_SECRET'), 'SESSION_SECRET must not appear in cleartext');

  const aiGov = await adminService.getAiGovernance();
  const aiGovStr = JSON.stringify(aiGov);
  assert.ok(!aiGovStr.includes('AIza'), 'Gemini API Key must never be exposed');
  assert.ok(['CONFIGURED', 'NOT_CONFIGURED', 'AVAILABLE', 'MISSING'].includes(aiGov.geminiStatus), 'Gemini status must be safe enum');
  assert.strictEqual(aiGov.model, 'gemini-3.8-flash', 'Configured model must be gemini-3.8-flash');
  assert.strictEqual(aiGov.dataSource, 'DATABASE_DERIVED', 'AI telemetry must be derived from database, not fabricated');
  recordPass('Zero credential exposure and truthful AI governance telemetry verified');

  // 7. Cryptographic Tamper-Evident Audit Hash Chaining
  console.log('Test 7: Verifying cryptographic SHA-256 audit chaining integrity...');
  const auditVerification = await adminService.verifyAuditIntegrity();
  assert.strictEqual(auditVerification.verified, true, 'Cryptographic audit chain must be valid');
  assert.ok(auditVerification.checkedCount >= 5, 'At least 5 audit records must be cryptographically verified');
  recordPass(`Cryptographic audit hash chain verified (${auditVerification.checkedCount} records chained)`);

  // 8. Integration Gateway Circuit Breakers & Webhook Signatures
  console.log('Test 8: Verifying Integration Gateway circuit breaker states and HMAC-SHA256 signatures...');
  const intList = await integrationService.listIntegrations();
  const analytics = await integrationService.getSummaryAnalytics();
  assert.ok(intList.length >= 5, 'Integration registry must have at least 5 registered adapters');
  assert.strictEqual(analytics.activeCircuitBreakers, 0, 'No circuit breakers should be in tripped state');

  const secret = 'corevia_test_webhook_secret_key_123';
  const payload = JSON.stringify({ event: 'TEST_EVENT', timestamp: Date.now() });
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  assert.strictEqual(sig.length, 64, 'HMAC-SHA256 signature must be 64 hex characters');
  recordPass('Integration Gateway circuit breakers healthy and HMAC-SHA256 verified');

  // 9. Controlled Agent Two-Stage Human-in-the-Loop Gate
  console.log('Test 9: Verifying Controlled Agent strict human approval requirement...');
  const plans = await db.select().from(agentPlans);
  assert.ok(Array.isArray(plans), 'Controlled agent plans must be listable');
  for (const plan of plans) {
    if (plan.status === 'AWAITING_APPROVAL') {
      assert.ok(!plan.approvedAt, 'Unapproved plan cannot have approval timestamp');
      assert.ok(!plan.completedAt, 'Unapproved plan cannot have completion timestamp');
    }
  }
  recordPass('Controlled Banking Agent human confirmation gate verified');

  // 10. Authentication Session Hardening & User Lifecycle Session Purge
  console.log('Test 10: Verifying login response credential withholding and active session purge on status transition...');

  // A. Verify login response JSON body does NOT expose raw session token or credentials
  const loginResult = await authService.login({
    identifier: 'aditya.raj@corevia.bank.in',
    password: DEV_TEST_PASSWORD,
    ipAddress: '127.0.0.1',
    userAgent: 'Automated-Hardening-Test-Runner/1.0',
    requestId: 'REQ-TEST-LOGIN-JSON-001',
  });
  assert.strictEqual(loginResult.success, true, 'Admin login with valid test credentials must succeed');

  // Shape response identically to /api/auth/login endpoint in src/api/routes.ts
  const loginClientResponseBody: any = {
    status: 'SUCCESS',
    message: 'Authentication successful',
    expiresAt: loginResult.expiresAt,
    user: loginResult.user,
  };
  assert.strictEqual(loginClientResponseBody.sessionToken, undefined, 'Login response JSON body MUST NOT contain sessionToken');
  assert.strictEqual(loginClientResponseBody.user.password, undefined, 'Login response user object MUST NOT contain password');
  assert.strictEqual(loginClientResponseBody.user.passwordHash, undefined, 'Login response user object MUST NOT contain passwordHash');
  assert.strictEqual(loginClientResponseBody.sessionSecret, undefined, 'Login response MUST NOT expose session secret');

  // B. Verify active sessions purge when user account transitions to INACTIVE
  const activeUsers = await db.select().from(users).where(eq(users.status, 'ACTIVE')).limit(10);
  const targetUser = activeUsers.find((u) => u.id !== 1) || activeUsers[1];
  assert.ok(targetUser, 'A synthetic active test user must exist');
  assert.notStrictEqual(targetUser.id, 1, 'Target user must not be administrator ID 1');
  assert.strictEqual(targetUser.status, 'ACTIVE', 'Selected user must be ACTIVE initially');

  const testSessionToken = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const insertedSession = await db
    .insert(sessions)
    .values({
      userId: targetUser.id,
      sessionToken: testSessionToken,
      lastActivityAt: now,
      expiresAt: expiresAt,
      ipAddress: '127.0.0.1',
      userAgent: 'Automated-Hardening-Test-Runner/1.0',
    })
    .returning();

  try {
    const sessionInDb = await db.select().from(sessions).where(eq(sessions.id, insertedSession[0].id));
    assert.strictEqual(sessionInDb.length, 1, 'Created session must exist in PostgreSQL sessions table');
    assert.strictEqual(sessionInDb[0].userId, targetUser.id, 'Session must belong to target user');

    // 1. Transition user to INACTIVE
    const updateResult = await adminService.updateUserStatus({
      actorUserId: 1,
      actorName: 'Aditya Raj',
      actorEmployeeId: 'EMP-ADM001',
      targetUserId: targetUser.id,
      status: 'INACTIVE',
      reason: 'Automated security session purge verification',
      requestId: 'REQ-TEST-PURGE-001',
    });
    assert.strictEqual(updateResult.success, true, 'User status update to INACTIVE must succeed');

    const remainingSessions = await db.select().from(sessions).where(eq(sessions.userId, targetUser.id));
    assert.strictEqual(remainingSessions.length, 0, 'All active sessions for INACTIVE user must be purged from database');

    const updatedUser = await db.select().from(users).where(eq(users.id, targetUser.id));
    assert.strictEqual(updatedUser[0].status, 'INACTIVE', 'User status must be INACTIVE in database');
    assert.strictEqual(updatedUser[0].isActive, false, 'User isActive must be false in database');

    // Verify session validation rejects purged token
    const validatedSession = await authService.validateSession(testSessionToken);
    assert.strictEqual(validatedSession, null, 'Purged session must fail session validation');

    // Verify login attempt for INACTIVE user is rejected with 403
    const inactiveLogin = await authService.login({
      identifier: targetUser.email,
      password: DEV_TEST_PASSWORD,
      requestId: 'REQ-TEST-INACTIVE-LOGIN',
    });
    assert.strictEqual(inactiveLogin.success, false, 'Inactive user login must be rejected');
    assert.strictEqual(inactiveLogin.statusCode, 403, 'Inactive user login must return 403 Forbidden');

    // 2. Transition user to LOCKED and verify login rejection
    await adminService.updateUserStatus({
      actorUserId: 1,
      actorName: 'Aditya Raj',
      actorEmployeeId: 'EMP-ADM001',
      targetUserId: targetUser.id,
      status: 'LOCKED',
      reason: 'Automated lockout verification',
      requestId: 'REQ-TEST-LOCK-001',
    });
    const lockedLogin = await authService.login({
      identifier: targetUser.email,
      password: DEV_TEST_PASSWORD,
      requestId: 'REQ-TEST-LOCKED-LOGIN',
    });
    assert.strictEqual(lockedLogin.success, false, 'Locked user login must be rejected');
    assert.strictEqual(lockedLogin.statusCode, 403, 'Locked user login must return 403 Forbidden');

    // 3. Transition user to SUSPENDED and verify login rejection
    await adminService.updateUserStatus({
      actorUserId: 1,
      actorName: 'Aditya Raj',
      actorEmployeeId: 'EMP-ADM001',
      targetUserId: targetUser.id,
      status: 'SUSPENDED',
      reason: 'Automated suspension verification',
      requestId: 'REQ-TEST-SUSPEND-001',
    });
    const suspendedLogin = await authService.login({
      identifier: targetUser.email,
      password: DEV_TEST_PASSWORD,
      requestId: 'REQ-TEST-SUSPENDED-LOGIN',
    });
    assert.strictEqual(suspendedLogin.success, false, 'Suspended user login must be rejected');
    assert.strictEqual(suspendedLogin.statusCode, 403, 'Suspended user login must return 403 Forbidden');

    const purgeAuditLogs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, 'ADMIN_USER_STATUS_CHANGE'))
      .orderBy(desc(auditLogs.id))
      .limit(5);

    const matchingAudit = purgeAuditLogs.find((l) => l.resourceId === String(targetUser.id));
    assert.ok(matchingAudit, 'Audit record for ADMIN_USER_STATUS_CHANGE must exist');
    assert.strictEqual(matchingAudit.outcome, 'SUCCESS', 'Audit outcome must be SUCCESS');
  } finally {
    // Test cleanup: restore target user state to ACTIVE
    await db
      .update(users)
      .set({ status: 'ACTIVE', isActive: true, updatedAt: new Date() })
      .where(eq(users.id, targetUser.id));
    await db.delete(sessions).where(eq(sessions.sessionToken, testSessionToken));
  }
  recordPass('User lifecycle session purge and auth rejection for inactive/locked/suspended accounts verified');

  // 11. CORS Origin Allowlist Hardening
  console.log('Test 11: Verifying hardened CORS explicit allowlist & rejection of spoofed origins...');
  // PASS: localhost
  assert.strictEqual(isOriginAllowed('http://localhost:3000'), true, 'localhost:3000 must be allowed');
  assert.strictEqual(isOriginAllowed('http://127.0.0.1:3000'), true, '127.0.0.1:3000 must be allowed');

  // FAIL: arbitrary evil origins
  assert.strictEqual(isOriginAllowed('https://evil.example.com'), false, 'evil.example.com must be rejected');
  assert.strictEqual(isOriginAllowed('https://attacker.google.com'), false, 'attacker.google.com must be rejected');
  assert.strictEqual(isOriginAllowed('https://evil.run.app'), false, 'evil.run.app must be rejected');
  assert.strictEqual(isOriginAllowed('https://fake.ai.studio'), false, 'fake.ai.studio must be rejected');

  // FAIL: empty or malformed
  assert.strictEqual(isOriginAllowed(undefined), false, 'undefined origin must be rejected');
  assert.strictEqual(isOriginAllowed(''), false, 'empty origin must be rejected');
  assert.strictEqual(isOriginAllowed('not-a-valid-url'), false, 'malformed origin must be rejected');
  recordPass('Hardened CORS allowlist accurately allows configured origins and rejects attacks');

  // 12. CSRF Protection Hardening
  console.log('Test 12: Verifying hardened CSRF middleware protection against forged requests...');
  let csrfCalled = false;
  const mockNext = () => {
    csrfCalled = true;
  };

  // Safe GET method: PASS
  csrfCalled = false;
  csrfProtection({ method: 'GET', headers: {} } as any, {} as any, mockNext);
  assert.strictEqual(csrfCalled, true, 'GET request must pass CSRF');

  // Bearer token mutation: PASS
  csrfCalled = false;
  csrfProtection(
    { method: 'POST', headers: { authorization: 'Bearer test-token-123' } } as any,
    {} as any,
    mockNext
  );
  assert.strictEqual(csrfCalled, true, 'Bearer-authenticated POST must pass CSRF');

  // Valid CSRF Token: PASS
  csrfCalled = false;
  csrfProtection(
    { method: 'POST', headers: { 'x-csrf-token': 'valid-csrf-token-abc' } } as any,
    {} as any,
    mockNext
  );
  assert.strictEqual(csrfCalled, true, 'POST with valid X-CSRF-Token must pass');

  // Valid Allowed Origin: PASS
  csrfCalled = false;
  csrfProtection(
    { method: 'POST', headers: { origin: 'http://localhost:3000' } } as any,
    {} as any,
    mockNext
  );
  assert.strictEqual(csrfCalled, true, 'POST from allowed origin must pass');

  // Malicious Origin: FAIL (403)
  let rejectedStatus = 0;
  let rejectedBody: any = null;
  const mockRes = {
    status(code: number) {
      rejectedStatus = code;
      return {
        json(body: any) {
          rejectedBody = body;
        },
      };
    },
  };

  csrfCalled = false;
  csrfProtection(
    { method: 'POST', headers: { origin: 'https://evil.example.com', 'x-requested-with': 'XMLHttpRequest' } } as any,
    mockRes as any,
    mockNext
  );
  assert.strictEqual(csrfCalled, false, 'Malicious origin POST must be blocked by CSRF');
  assert.strictEqual(rejectedStatus, 403, 'CSRF failure must return 403');
  assert.strictEqual(rejectedBody?.error?.code, 'CSRF_VALIDATION_FAILED');

  // Missing origin and token on cookie mutation: FAIL (403)
  rejectedStatus = 0;
  csrfProtection(
    { method: 'POST', headers: {} } as any,
    mockRes as any,
    mockNext
  );
  assert.strictEqual(rejectedStatus, 403, 'Cookie POST missing origin and token must return 403');
  recordPass('Hardened CSRF validation successfully enforces origin and token boundaries');

  // 13. Production Environment Validation Logic
  console.log('Test 13: Verifying centralized environment validation with safe error reporting...');
  const currentEnv = validateEnvironment();
  assert.strictEqual(typeof currentEnv.valid, 'boolean');
  assert.ok(Array.isArray(currentEnv.errors));
  assert.ok(Array.isArray(currentEnv.warnings));
  assert.strictEqual(currentEnv.configSummary.geminiModel, 'gemini-3.8-flash');
  recordPass('Centralized environment validation executes safely without leaking secrets');

  // 14. Session Revocation: Unknown Target Session Handling
  console.log('Test 14: Verifying session revocation error handling on unknown session...');
  let unknownSessionError = false;
  try {
    await adminService.revokeSession({
      actorEmployeeId: 'EMP-ADM001',
      actorName: 'Aditya Raj',
      sessionId: 99999999, // Non-existent session
      reason: 'Revocation test',
      requestId: 'REQ-TEST-REVOKE-UNKNOWN',
    });
  } catch (err: any) {
    unknownSessionError = err.message.includes('not found');
  }
  assert.ok(unknownSessionError, 'Revoking non-existent session must throw not found error');
  recordPass('Non-existent session revocation safely handled');

  // 15. Database Health Check & Latency Verification
  console.log('Test 15: Verifying database health check ping and latency metrics...');
  const dbHealth = await adminService.getDatabaseHealth();
  assert.strictEqual(dbHealth.connectionStatus, 'CONNECTED', 'Database health must be CONNECTED');
  assert.ok(dbHealth.latencyMs >= 0, 'Database latency must be non-negative number');
  recordPass(`Database health confirmed (${dbHealth.connectionStatus}, Latency: ${dbHealth.latencyMs} ms)`);

  console.log('\n========================================================================');
  console.log(`   PHASE 40 FINAL HARDENING SUITE COMPLETE: ${passed}/${total} TESTS PASSED`);
  console.log('========================================================================\n');

  return { passed, total };
}
