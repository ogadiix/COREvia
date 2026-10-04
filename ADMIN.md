# COREvia Enterprise Administration & Governance Center

## 1. Overview & Architectural Role
The **Enterprise Administration & Governance Center** (`/admin`) is the institutional control plane for the COREvia banking platform. It serves as an authoritative management hub for banking identity, role-based access control (RBAC), multi-dimensional resource scopes, server-side session lifecycles, security incident response, governed feature flags, AI telemetry, system health, and tamper-evident audit trails.

> **Access Restriction:** In accordance with RBI IT Governance Frameworks and dual-control banking security standards, `/admin` is restricted strictly to authenticated personnel possessing the `ADMINISTRATOR` role. All unauthorized ingress attempts are blocked at the HTTP layer (403 Forbidden) and recorded into the security audit ledger.

---

## 2. Core Functional Modules

### 2.1 User Administration
- **Roster & Metadata:** Displays full identity records (System UID, Employee ID, Official Email, Department, Job Title, Status, and Last Login timestamp).
- **Statuses Supported:** `ACTIVE`, `INACTIVE`, `LOCKED`, `SUSPENDED`.
- **Governed Transitions:** Administrative mutations require explicit confirmation dialogs detailing action impact and mandatory justification.
- **Self-Protection Guard:** Strict invariant `ADMIN_CANNOT_DEACTIVATE_SELF` forbids an administrator from suspending, deactivating, or locking their own user account.
- **Session Purge on Deactivation:** Transitioning an account to `INACTIVE`, `LOCKED`, or `SUSPENDED` immediately revokes all active PostgreSQL session records across all client devices.
- **Zero Plaintext Credentials:** Plaintext passwords and password hashes are never returned by APIs or rendered on the client.

### 2.2 Calculated Effective Permissions & Scope Engine
- **Calculated View:** User permissions are computed dynamically from assigned role mappings. Zero duplicate or divergent permission copies are stored.
- **15 Canonical Domains:**
  1. `CUSTOMERS`
  2. `ACCOUNTS`
  3. `LOANS`
  4. `PRODUCTS`
  5. `SERVICE`
  6. `OPPORTUNITIES`
  7. `TASKS`
  8. `ANALYTICS`
  9. `COPILOT`
  10. `OPERATIONS`
  11. `INTEGRATIONS`
  12. `DOCUMENTS`
  13. `ONBOARDING`
  14. `GOVERNANCE`
  15. `ADMIN`
- **Resource Scopes:** Role assignment grants capability types but does not grant unrestricted access to customer records. Scopes are strictly bounded by:
  - Branch Scope (`BR-001`, Mumbai Nariman Point)
  - Department Scope (`BRANCH_OPERATIONS`, `WEALTH_MANAGEMENT`, `RISK_AND_COMPLIANCE`)
  - RM Portfolio Scope (Assigned commercial customer codes)
  - Organization Scope (`COREvia Institutional Banking Division`)

### 2.3 Session Lifecycle & Revocation
- **PostgreSQL Session Storage:** Server-side sessions with cryptographic random tokens stored with explicit expiration timestamps and user-agent metadata.
- **Single & Bulk Revocation:** Administrators can terminate individual sessions or execute bulk session invalidation across all active terminals for a given principal.
- **Audit Logging:** Every session revocation is recorded with principal ID, reason, and correlation ID.
- **Data Minimization:** Raw session tokens are never exposed in UI or responses (previews are masked as `SES-<id>-<preview>***`).

### 2.4 Security Events & Incident Response
- **Event Types Monitored:** `AUTH_FAILURE`, `AUTHORIZATION_FAILURE`, `IDOR_ATTEMPT`, `CSRF_FAILURE`, `RATE_LIMIT`, `INVALID_INPUT`, `SECRET_ACCESS_ATTEMPT`, `SUSPICIOUS_SESSION`, `WEBHOOK_SIGNATURE_FAILURE`, `INTEGRATION_AUTH_FAILURE`.
- **Detail Drawer:** Provides full event telemetry, source IP, user-agent, target resource URI, and sanitized evidence metadata.
- **Secret Sanitization:** Automated redaction replaces all password, token, session secret, and API key references in metadata with `[PROTECTED_SECRET]`.

### 2.5 AI & Copilot Governance
- **Gemini API Key Shielding:** `GEMINI_API_KEY` is strictly classified as a high-security secret. The admin UI and APIs report only operational availability (`CONFIGURED`, `NOT_CONFIGURED`, `AVAILABLE`, `MISSING`).
- **Telemetry Monitored:**
  - Active Model & fine-tuning tier
  - Fallback engine state (`DETERMINISTIC_RULES_ENGINE_STANDBY`)
  - Copilot sessions count and AI error rate
  - Regulated tool call breakdowns
  - Action proposals vs. human confirmations vs. rejections
  - Source classifications (`DETERMINISTIC`, `AI_GENERATED`, `HYBRID`, `SYSTEM_RULE`)

### 2.6 Governed Feature Flags
- **Flag Metadata:** `flagKey`, `name`, `description`, `enabled`, `environment`, `rolloutScope`, `owner`.
- **Core Banking Flags:**
  - `COPILOT_ENABLED`
  - `RELATIONSHIP_GRAPH_ENABLED`
  - `OPERATIONS_ENABLED`
  - `PORTFOLIO_INTELLIGENCE_ENABLED`
  - `INTEGRATIONS_ENABLED`
  - `GOVERNANCE_TAMPER_EVIDENT_HASHING`
  - `AUTOMATED_SLA_ESCALATION`
- **Security Invariant:** Feature flags may disable modular functional features, but can **NEVER** bypass authentication, authorization, RBAC, maker-checker controls, or audit logging. Attempted security control bypasses are blocked and logged as critical security incidents.

### 2.7 System Configuration & Database Health
- **Read-Only System Metadata:** Environment (`DEVELOPMENT`, `STAGING`, `PRODUCTION`), Node engine version, application version, build version, migration state.
- **Database Telemetry:** Live ping latency (ms), connection state, schema version, active pool connections.
- **Maintenance Mode:** Controlled operational mode to defer non-admin transactions during schema upgrades.
  - Requires `ADMINISTRATOR` privilege.
  - Requires justification, actor logging, and optional duration.
  - **No Admin Lockout:** Administrators retain full control-plane access throughout maintenance mode.

### 2.8 Background Jobs & Operations
- **Tracked Operations:**
  - `JOB-SLA-001` (SLA Breach Detection)
  - `JOB-SES-002` (Expired Session Purge)
  - `JOB-INT-003` (Integration Heartbeat Poller)
  - `JOB-SIG-004` (Signal Pipeline Dispatcher)
  - `JOB-TMP-005` (Audit Integrity Verifier)
- **Status Metrics:** Execution duration (ms), retry counts, error classification, correlation IDs.

### 2.9 Tamper-Evident Audit Center
- **Cryptographic Hash Chaining:** Every administrative action is hashed using SHA-256 with chaining back to the previous record hash (`previousHash | actor | action | resource | outcome | metadata | timestamp`).
- **Integrity Verifier:** Automated integrity verification checks sequential hash chaining across the audit vault, returning status `VERIFIED` or `TAMPER_DETECTED`.

---

## 3. API Gateway Specifications

All endpoints are mounted at `/api/admin` and require `requireAuth` + `requireRole('ADMINISTRATOR')`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/overview` | System-derived administrative metrics |
| `GET` | `/api/admin/users` | Filterable user accounts roster |
| `GET` | `/api/admin/users/:id` | Full user detail, permissions, and scopes |
| `POST` | `/api/admin/users/:id/status` | Transition status (`ACTIVE`, `INACTIVE`, `LOCKED`, `SUSPENDED`) |
| `POST` | `/api/admin/users/:id/reset-access` | Reset access credentials and clear sessions |
| `GET` | `/api/admin/roles` | Configured roles with user counts |
| `GET` | `/api/admin/permissions` | Permissions matrix across 15 domains |
| `GET` | `/api/admin/sessions` | Active sessions with masked tokens |
| `POST` | `/api/admin/sessions/:id/revoke` | Revoke specific session |
| `POST` | `/api/admin/users/:id/revoke-sessions` | Bulk revoke all sessions for a user |
| `GET` | `/api/admin/login-activity` | Authentication and access attempts |
| `GET` | `/api/admin/security-events` | Filterable security event ledger |
| `GET` | `/api/admin/security-events/:id` | Security event detail with sanitized evidence |
| `GET` | `/api/admin/ai-governance` | Gemini status and Copilot telemetry |
| `GET` | `/api/admin/integrations` | Summary of Phase 38 API adapters |
| `GET` | `/api/admin/notifications` | Notification delivery and escalation policies |
| `GET` | `/api/admin/sla` | SLA thresholds across operations domains |
| `GET` | `/api/admin/feature-flags` | Governed feature flags |
| `POST` | `/api/admin/feature-flags/:key/toggle` | Toggle feature flag with audit log |
| `GET` | `/api/admin/system-config` | Read-only environment and version metadata |
| `GET` | `/api/admin/database-health` | Live database latency and migration state |
| `GET` | `/api/admin/jobs` | Background job execution telemetry |
| `GET` | `/api/admin/maintenance` | Current maintenance mode state |
| `POST` | `/api/admin/maintenance` | Toggle maintenance mode |
| `GET` | `/api/admin/governance-exceptions`| Open governance exceptions |
| `GET` | `/api/admin/audit` | Filterable administrative audit trail |
| `GET` | `/api/admin/audit/verify-integrity`| Cryptographic SHA-256 chain verification |

---

## 4. Verification & Quality Gate
- **Test Suite:** Suite 14 (`src/tests/admin.test.ts`), covering 26 automated integration and security verifications.
- **Overall Coverage:** 14 test suites, 321 automated verifications passing cleanly.
- **Production Build:** `npm run build` succeeds with zero errors.
- **Live QA:** Puppeteer automated visual verification captures four institutional artifacts:
  - `admin_overview.png`: Control plane dashboard with real metrics.
  - `admin_user_detail_drawer.png`: User detail with calculated permissions and scope.
  - `admin_security_event_detail.png`: Sanitized security incident evidence.
  - `admin_feature_flags.png`: Governed environment feature toggles.
  - `admin_access_denied_notice.png`: Non-admin 403 Forbidden access denial.
