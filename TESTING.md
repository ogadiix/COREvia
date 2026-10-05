# COREvia Automated Testing & Verification Suite

## 1. Overview

COREvia incorporates an automated testing harness ensuring end-to-end correctness, strict RBAC authorization, IDOR defense, cryptographic audit chaining, and data minimization across all banking modules.

The test suite runs with zero external mocks on native Node.js + TypeScript (`tsx src/tests/runAllTests.ts`) against the PostgreSQL backing store:

```bash
npm test
```

Current Test Status: **15 Test Suites, 336 Assertions, 100% Passing**.

---

## 2. Test Suites Summary

| Suite # | Test File | Domain / Focus Area | Assertions |
|---|---|---|---|
| 1 | `coreBanking.test.ts` | CASA, Term Deposits, Lending, Maker-Checker Dual Control | 18 |
| 2 | `relationshipGraph.test.ts` | Graph Intelligence, Bounded BFS Traversal, Node Scoring | 10 |
| 3 | `notification.test.ts` | Notification Engine, Deduplication, Preference Filtering | 9 |
| 4 | `decisionTrace.test.ts` | AI Decision Trace, Lineage, Evidence, Cross-Customer IDOR Defense | 20 |
| 5 | `strategySimulator.test.ts` | What-If Simulation Sandbox, Sequential Pipeline, Staleness | 21 |
| 6 | `controlledAgent.test.ts` | Controlled Banking Agent, Propose-Approve-Execute, Human Gate | 15 |
| 7 | `relationshipValue.test.ts` | Multidimensional Value Intelligence, Trajectory, Scenarios | 22 |
| 8 | `journey.test.ts` | Customer Journey Orchestrator, Lifecycle State Machine, SLAs | 33 |
| 9 | `group.test.ts` | Household & Business Group 360, Member Privacy Masking, Dual Auth | 30 |
| 10 | `governance.test.ts` | Trust & Governance Center, Cryptographic SHA-256 Chaining, Exceptions | 47 |
| 11 | `operations.test.ts` | Operational Escalations, SLA Monitoring, Incident Workflows | 20 |
| 12 | `portfolioIntelligence.test.ts` | Portfolio Analytics, Branch Scoping, Risk Aggregation | 24 |
| 13 | `integrations.test.ts` | Integration Registry, Circuit Breakers, Webhooks, Idempotency | 26 |
| 14 | `admin.test.ts` | Enterprise Administration & Governance Center | 26 |
| 15 | `finalHardening.test.ts` | **Phase 40: Final Hardening, Security Remediation & Release Gate** | **15** |
| **Total** | | | **336** |

---

## 3. Suite 14: Enterprise Administration & Governance Center (`admin.test.ts`)

Suite 14 comprehensively tests the institutional administrative control plane across 26 distinct scenarios:

1. **Admin Authentication & RBAC**: Confirms administrative session validation and role verification.
2. **Non-Admin Access Denial**: Verifies `RELATIONSHIP_MANAGER` receives `403 Forbidden` on `/api/admin/overview`.
3. **Admin Overview System Metrics**: Validates derived metrics (`activeUsers`, `activeSessions`, `failedLoginAttempts`, etc.) with zero hardcoding.
4. **User Roster Retrieval & Filtering**: Tests pagination, role, and department filtering.
5. **User Detail & Calculated Effective Permissions**: Inspects identity, employment, and dynamically resolved permissions across 15 domains.
6. **Role Management**: Validates system roles (`ADMINISTRATOR`, `BRANCH_OPS_HEAD`, `MAKER`, etc.) with user counts.
7. **Permission Domain Catalog**: Confirms coverage of all 15 enterprise permission domains.
8. **Resource Scope Management**: Validates organizational, branch, and portfolio scope boundaries.
9. **Single Session Revocation**: Verifies targeted session termination and audit logging.
10. **User-Wide Session Revocation**: Verifies terminating all active sessions for a target user across all devices.
11. **Security Events Telemetry**: Tests querying security event feeds (`AUTH_FAILURE`, `AUTHORIZATION_FAILURE`, `IDOR_ATTEMPT`, etc.).
12. **Security Event Detail & Data Minimization**: Ensures passwords, API keys, and session tokens are completely absent from evidence metadata.
13. **Login Activity Auditing**: Verifies authentication outcomes and correlation IDs.
14. **AI & Copilot Governance Telemetry**: Validates safe Gemini configuration inspection (`CONFIGURED` / `AVAILABLE` / `MISSING`) without secret leakage.
15. **Integration Administration Visibility**: Confirms links and health telemetry from Phase 38 `/integrations`.
16. **Notification Configuration Inspection**: Validates notification categories, delivery states, and deduplication policies.
17. **SLA Configuration Verification**: Tests inspection of SLA policies across Service, Task, KYC, Approval, and Journey.
18. **Feature Flag Listing & Metadata**: Validates governed feature flags with environment and rollout scopes.
19. **Feature Flag Mutation & Audit Logging**: Confirms updating feature flag states emits `FEATURE_FLAG_UPDATED` audit entries.
20. **Feature Flag Safety Invariant**: Strictly verifies that feature flags cannot disable security controls (`SECURITY_CONTROLS_CANNOT_BE_DISABLED_BY_FEATURE_FLAGS`).
21. **System Configuration Secret Shielding**: Verifies `DATABASE_URL` and `SESSION_SECRET` are never exposed in system config endpoints.
22. **Database Health Verification**: Tests live database latency checks without exposing connection strings.
23. **Background Jobs Status**: Verifies genuine operational status of background tasks without fabricated queues.
24. **Maintenance Mode Toggle & Anti-Lockout**: Verifies maintenance mode activation retains administrator control-plane access.
25. **Tamper-Evident SHA-256 Audit Chaining**: Validates cryptographic hash chaining across consecutive administrative audit logs.
26. **Governance Exceptions Visibility**: Validates open exception tracking and classification.

---

## 4. Suite 15: Final Hardening, Security Remediation & Release Gate (`finalHardening.test.ts`)

Suite 15 validates end-to-end coherence, strict security boundaries, authentication hardening, and environmental determinism across 15 comprehensive tests:

1. **Canonical Customer Coherence**: Confirms Rahul Sharma (`CUS-10482`, ID: 1) maintains accounts, loans, opportunities, cases, and documents without synthetic orphan state.
2. **Deterministic End-to-End Action Traceability**: Validates the complete chain from Signal -> Decision Trace -> Strategy Simulator -> Controlled Agent Plan -> Audit.
3. **Admin Self-Protection Against Status Mutation**: Strictly enforces `ADMIN_CANNOT_DEACTIVATE_SELF` preventing an admin from self-deactivating, suspending, or locking out.
4. **Unknown User Status Update Rejection**: Ensures updating status of non-existent users throws `404 Not Found`.
5. **Feature Flag Anti-Bypass Invariant**: Verifies feature flags cannot disable authentication, authorization, or audit logging.
6. **Zero Secret Exposure & Database-Derived AI Telemetry**: Confirms `GEMINI_API_KEY`, `SESSION_SECRET`, and `DATABASE_URL` are strictly shielded; verifies AI metrics derive from database sessions/plans (`dataSource: 'DATABASE_DERIVED'`).
7. **Tamper-Evident SHA-256 Audit Chaining**: Validates cryptographic hash chaining across system mutations.
8. **Integration Gateway & Circuit Breakers**: Verifies synthetic banking adapters fail safely with circuit breaker protection without claiming real banking infrastructure connectivity.
9. **Controlled Banking Agent Two-Stage Gate**: Enforces that high-impact banking mutations cannot execute without explicit human approval.
10. **Real Session Purge Integration Test (12-Step)**: Validates that deactivating or suspending a user atomically terminates and purges all active session rows from PostgreSQL, sets `isActive: false`, creates audit records, and leaves no residual sessions.
11. **Strict CORS Explicit Allowlist**: Verifies exact-origin matching via `getAllowedOrigins()`; verifies localhost allowed, arbitrary malicious origins and malformed URLs rejected.
12. **CSRF Protection Verification**: Confirms safe GET requests succeed, Bearer token requests pass, CSRF token header requests pass, trusted Origin requests pass, while cross-origin malicious requests and unverified mutations are rejected with `403 Forbidden`.
13. **Centralized Environment Validation**: Tests `validateEnvironment` to ensure required variables in production are enforced, warnings are emitted for optional variables, and safe error summaries are produced without deep `process.exit()`.
14. **Non-Existent Session Revocation**: Verifies gracefully handling revocation of non-existent sessions with appropriate error codes.
15. **Database Health Check & Latency Ping**: Tests live PostgreSQL connectivity (`SELECT 1`) returning valid latency metrics.

---

## 5. Verification Workflow

Prior to any commit or deployment, the full verification pipeline must pass:

```bash
# 1. Typecheck
npm run typecheck

# 2. Lint
npm run lint

# 3. Automated Test Suites
npm test

# 4. Production Build Bundle
npm run build
```
