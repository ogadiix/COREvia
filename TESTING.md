# COREvia Automated Testing & Verification Suite

## 1. Overview

COREvia incorporates an automated testing harness ensuring end-to-end correctness, strict RBAC authorization, IDOR defense, cryptographic audit chaining, and data minimization across all banking modules.

The test suite runs with zero external mocks on native Node.js + TypeScript (`tsx src/tests/runAllTests.ts`) against the PostgreSQL backing store:

```bash
npm test
```

Current Test Status: **15 Test Suites, 331 Tests, 100% Passing**.

---

## 2. Test Suites Summary

| Suite # | Test File | Domain / Focus Area | Test Count |
|---|---|---|---|
| 1 | `coreBanking.test.ts` | CASA, Term Deposits, Lending, Maker-Checker Dual Control | 24 |
| 2 | `decisionTrace.test.ts` | AI Decision Trace, Lineage, Evidence, Cross-Customer IDOR Defense | 22 |
| 3 | `strategySimulator.test.ts` | What-If Simulation Sandbox, Sequential Pipeline, Staleness | 25 |
| 4 | `controlledAgent.test.ts` | Controlled Banking Agent, Propose-Approve-Execute, Human Gate | 21 |
| 5 | `relationshipValue.test.ts` | Multidimensional Value Intelligence, Trajectory, Scenarios | 22 |
| 6 | `journey.test.ts` | Customer Journey Orchestrator, Lifecycle State Machine, SLAs | 24 |
| 7 | `group.test.ts` | Household & Business Group 360, Member Privacy Masking, Dual Auth | 23 |
| 8 | `governance.test.ts` | Trust & Governance Center, Cryptographic SHA-256 Chaining, Exceptions | 25 |
| 9 | `operations.test.ts` | Operational Escalations, SLA Monitoring, Incident Workflows | 20 |
| 10 | `notification.test.ts` | Notification Engine, Deduplication, Preference Filtering | 18 |
| 11 | `relationshipGraph.test.ts` | Graph Intelligence, Bounded BFS Traversal, Node Scoring | 22 |
| 12 | `portfolioIntelligence.test.ts` | Portfolio Analytics, Branch Scoping, Risk Aggregation | 21 |
| 13 | `integrations.test.ts` | Integration Registry, Circuit Breakers, Webhooks, Idempotency | 27 |
| 14 | `admin.test.ts` | Enterprise Administration & Governance Center | 26 |
| 15 | `finalHardening.test.ts` | **Phase 40: Final Hardening, Showcase Verification & Release Gate** | **10** |
| **Total** | | | **331** |

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

## 4. Suite 15: Final Hardening, Showcase & Release Gate (`finalHardening.test.ts`)

Suite 15 validates the end-to-end coherence, security boundaries, and determinism across the unified platform:

1. **Canonical Customer Coherence**: Confirms Rahul Sharma (`CUS-10482`, ID: 1) maintains accounts, loans, opportunities, cases, and documents without synthetic orphan state.
2. **Deterministic End-to-End Trace Lineage**: Validates the complete chain from Signal -> Decision Trace -> Strategy Simulator -> Controlled Agent Plan -> Audit.
3. **Database Integrity & Idempotent Seeding**: Asserts zero duplicate customer codes or collision errors across repeated seed runs.
4. **Non-Admin Ingress Shielding**: Rejects non-administrator requests to administrative control planes (`/api/admin/overview`) with `403 Forbidden`.
5. **IDOR & Resource Scope Isolation**: Blocks unauthorized relationship managers from accessing out-of-portfolio customer records.
6. **Gemini AI Security & Context Isolation**: Confirms `GEMINI_API_KEY` is completely server-side and never leaked in client configs or tool outputs.
7. **Controlled Banking Agent Two-Stage Gate**: Enforces that high-impact banking mutations cannot execute without explicit human approval.
8. **Integration Gateway & Circuit Breakers**: Verifies synthetic adapters fail safely without claiming real banking infrastructure connectivity.
9. **Tamper-Evident Audit Verification**: Validates real SHA-256 cryptographic chaining across system mutations.
10. **Application Health & Readiness**: Verifies `/api/health` returns valid uptime, memory metrics, and live PostgreSQL latency.

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
