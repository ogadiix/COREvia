# COREvia Security & Access Control Policy

## 1. Role-Based Access Control (RBAC)

COREvia implements fine-grained enterprise RBAC across all banking modules:

| Role | Description | Decision Trace Permissions |
|---|---|---|
| `ADMIN` | System administrator | Full read, audit access, system configuration |
| `CHECKER` | Dual-control authorizer | View traces, confirm/reject high-risk actions, inspect audit trail |
| `MAKER` | Transaction & onboarding creator | View traces, execute confirmed actions, initiate reviews |
| `OFFICER` | Relationship manager & branch staff | View portfolio traces, confirm recommendations, execute actions |
| `AUDITOR` | Compliance & regulatory inspector | Read-only inspection across all traces, evidence, and audit logs |

---

## 2. Insecure Direct Object Reference (IDOR) Defense

### 2.1 Customer Resource Scoping
All requests touching customer-scoped data pass through `resourceAuth`:
```typescript
// Enforce that the authenticated user has rights to inspect the target customer
await resourceAuth.authorizeCustomer(req.user, customerId);
```
- Relationship managers are scoped strictly to their assigned branch / portfolio.
- Access attempts to unauthorized customer IDs trigger `403 Forbidden` (`FORBIDDEN_SCOPE`) and emit an audit security alert.

### 2.2 Cross-Customer Decision Trace Isolation
Trace comparison explicitly validates that both traces belong to the identical customer:
```typescript
if (baseTrace.customerId !== targetTrace.customerId) {
  throw new BankingError('VALIDATION_ERROR', 'Cross-customer trace comparison forbidden', 400);
}
```
Attempting to cross-compare traces across disparate customers is blocked at the service boundary.

### 2.3 Strategy Simulator Isolation & Production Safeguards (Phase 30)
1. **Zero Database Mutation During Simulation**: All simulation runs evaluate in-memory state snapshots. Live records in `customers`, `accounts`, `loans`, `service_cases`, `opportunities`, and `tasks` cannot be modified by simulation execution.
2. **Cross-Customer Scenario Comparison Blocked**:
```typescript
if (baseScenario.customerId !== targetScenario.customerId) {
  throw new BankingError('VALIDATION_ERROR', 'Cross-customer scenario comparison forbidden to prevent information leakage', 400);
}
```
3. **Governed Human Bridge**: Promoting a simulated strategy to actual Core Banking execution requires explicit human justification notes (`confirmationNotes`) and generates an immutable audit record (`STRATEGY_SIMULATION_ACTION_APPLIED`).

### 2.4 Customer Journey Governance & Evidence Verification (Phase 33)
1. **Mandatory Customer Authorization**: Every journey route (`create`, `read`, `step update`, `handoff`, `escalate`, `outcome`) enforces `resourceAuth.authorizeCustomer` to prevent horizontal IDOR privilege escalation.
2. **Authoritative Evidence Verification**: Steps requiring compliance evidence (e.g. KYC, documents, service cases, tasks, opportunities) query live PostgreSQL tables directly; completion requests referencing forged or non-existent entity IDs are rejected with `400 Bad Request`.
3. **Dual-Control Handoffs & Terminal Freeze**: Journey ownership transfers require designated actor confirmation with audit logging. Completed or cancelled journeys are frozen against subsequent step mutations.

### 2.5 Group 360 Dual-Level Authorization & Privacy Filtering (Phase 34)
1. **Group Authorization != Member Authorization**: Group-level visibility grants awareness that the relationship group exists, but **NEVER grants implicit access to every member's confidential records**.
2. **Automated Per-Member Privacy Masking**: When an RM queries a group containing members not assigned to their portfolio:
   - Protected member names are masked to `"Protected Member (Restricted Access)"`.
   - Customer codes, CIF numbers, PAN, and identity attributes are omitted.
   - Financial relationship values and CORE scores are nulled.
   - Their financial metrics are excluded from group relationship value aggregation.
   - Cross-customer opportunities and service tickets are strictly filtered from nested responses.
3. **Forged Membership & Relationship Validation**: Membership addition validates actual customer entity existence in PostgreSQL (`404 Customer Not Found`) and enforces a strict allowlist of domain relationship types (`HOUSEHOLD_MEMBER`, `SPOUSE`, `DIRECTOR`, etc.). Fabricated types trigger `400 Bad Request`.

### 2.6 Trust & Governance Center Security & Integrity (Phase 35)
1. **Zero Secret Exposure**:
   - Model configurations, database connection strings, session secrets, and credentials are NEVER displayed in API responses or user interfaces.
   - `GEMINI_API_KEY` status is reflected strictly as a boolean `keyConfigured: true` / `"Configured"` or `"Missing"`.
2. **Tamper-Evident SHA-256 Audit Chaining**:
   - Every audit log entry records `previousHash` and `recordHash` computed over `sha256(previousHash|actorId|action|resourceType|resourceId|requestId|outcome|timestamp)`.
   - Genesis hash begins at `0000000000000000000000000000000000000000000000000000000000000000`.
   - Audit logs are strictly append-only; modification or deletion attempts break the cryptographic verification chain.
3. **Neutral, Non-Accusatory Authorization Monitoring**:
   - Access failures and denied requests are recorded with neutral operational terminology (`"Authorization failure"`, `"Repeated authorization failures"`, `"Requires review"`).
   - Subjective labels such as "malicious user" or arbitrary "Trust Scores" are strictly prohibited.
4. **Role Scoping & Exception Mutation Dual Control**:
   - Governance workspaces enforce strict RBAC (`ADMINISTRATOR`, `COMPLIANCE_OFFICER`, `BRANCH_OPS_HEAD`, `RELATIONSHIP_MANAGER`, `AUDITOR`).
   - Copilot governance tools are blocked for unauthorized operational roles (`TELLER` receives `403 Forbidden`).
   - Controlled AI Agents are strictly read-only and barred from mutating governance configurations, resolving exceptions, or modifying authorization rules.

---

## 3. Defense-in-Depth API Safeguards

1. **CSRF Mitigation**: Anti-CSRF double-submit cookies and custom header tokens protect state-changing POST/PUT/DELETE operations.
2. **Strict Transport Security & Headers**: `Helmet` configures `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and robust Content Security Policies (CSP).
3. **Payload Sanitization & Size Limits**: JSON payloads are capped to 1MB to prevent memory exhaustion attacks.
4. **Rate Limiting**: AI Copilot endpoints are bounded to 30 requests per minute per IP to mitigate Denial-of-Wallet and API abuse.
5. **Zero Secrets in Source Control**: `GEMINI_API_KEY`, `SESSION_SECRET`, and `DATABASE_URL` reside solely in server environment variables.
6. **Export Governance & Non-Exfiltration**: Data export operations generate immutable audit records (`DATA_EXPORT_REQUESTED`) capturing requesting actor, role, dataset, filter scope, and timestamp, without persisting raw customer payloads in audit storage.

---

## 4. Enterprise Administration & Governance Security Controls (Phase 39)

### 4.1 Strict Control Plane Authorization
- All `/api/admin/*` routes enforce `requireAuth` and `requireRole('ADMINISTRATOR')`. Non-administrative attempts are rejected with `403 Forbidden` and logged in `security_events` with category `AUTHORIZATION_FAILURE`.

### 4.2 Absolute Secret Shielding & Data Minimization
- **Zero Credential Exposure**: `GEMINI_API_KEY`, `SESSION_SECRET`, `DATABASE_URL`, password hashes, and raw session tokens are strictly shielded from the client.
- **Safe State Indicators**: The Admin UI only displays state metadata: `CONFIGURED`, `AVAILABLE`, `MISSING`, or `NOT_CONFIGURED`.
- **Masked Session Tokens**: Active session records reveal only session IDs, metadata (IP, user agent, timestamps), and expiry without revealing session secrets.

### 4.3 Self-Deactivation Guard (Anti-Lockout)
- An administrative user cannot mutate their own account status to `INACTIVE`, `LOCKED`, or `SUSPENDED` (`ADMIN_CANNOT_DEACTIVATE_SELF`). Violations trigger `403 Forbidden` and register an IDOR security alert.

### 4.4 Account Status Transition Session Purge
- Whenever any user is marked `INACTIVE`, `LOCKED`, or `SUSPENDED`, the administration engine immediately deletes all active session rows in the PostgreSQL database for that user (`sessions.userId = targetUserId`), instantly terminating active browser sessions.

### 4.5 Feature Flag Security Invariant
- Toggling feature flags (`COPILOT_ENABLED`, `INTEGRATIONS_ENABLED`, etc.) cannot be leveraged to bypass authentication, authorization, IDOR protection, maker-checker approvals, or audit logging. Attempts to disable security controls throw `403 Forbidden` (`SECURITY_CONTROLS_CANNOT_BE_DISABLED_BY_FEATURE_FLAGS`).

### 4.6 Maintenance Mode Invariant
- Activating maintenance mode stores structured metadata in `system_settings` (reason, actor, start, estimated end). Administrators retain unhindered access to the `/admin` control plane to prevent lockout.

