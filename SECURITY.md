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

### 3.1 Cookie-Only Browser Authentication
- **Zero Token Exposure in JSON**: Authentication endpoints (`/api/auth/login`) issue the ambient HTTP-only session cookie `corevia_session` and strictly omit `sessionToken`, `accessToken`, `refreshToken`, or raw credentials from the response JSON body.
- **Secure Cookie Configuration**:
  - `httpOnly: true` (prevents client-side JavaScript access / XSS token exfiltration).
  - `secure: true` in HTTPS/production (with safe local HTTP fallback for `localhost`).
  - `sameSite`: Configured to `lax` by default, or `none` when secure embedding is explicitly required for trusted demonstration frames.
  - Active sessions are backed by PostgreSQL and deleted immediately upon logout or user deactivation.

### 3.2 Strict CORS Explicit Allowlist
- **No Wildcard Subdomain Regexes**: Broad wildcard regex patterns (such as `*.run.app`, `*.google.com`) are removed in favor of an explicit origin allowlist.
- **Configured via `CORS_ALLOWED_ORIGINS`**: Only explicitly listed origins (plus the canonical `APP_URL` and `localhost` during development) are permitted cross-origin access.
- **Zero Header Reflection**: CORS decisions are never made by dynamically reflecting untrusted client headers such as `Host` or `X-Forwarded-Host`.
- **Conservative Trust Proxy**: Configured via `app.set('trust proxy', 1)` to trust only the immediate upstream reverse proxy.

### 3.3 CSRF Defense Model
- **Ambient Credential Protection**: All state-mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) carrying ambient session cookies must provide either:
  1. An `Origin` or `Referer` header matching an explicitly trusted allowed origin.
  2. A valid, verified `x-csrf-token` header.
- **Header Spoof Rejection**: Arbitrary cross-origin requests relying solely on `X-Requested-With` or mismatched origins are rejected with `403 Forbidden`.
- **API Token Exemption**: Bearer token authentication from programmatic clients is exempt from browser ambient-cookie CSRF checks.

### 3.4 Rate Limiting Architecture & Limitations
- **Process-Local Rate Limiter**: Rate limiting is implemented using an in-memory sliding token bucket suitable for single-instance synthetic/local deployment.
- **Explicit Distributed Limitation**: This in-memory limiter is process-local and is **not** a distributed production rate limiter. For horizontally scaled, multi-instance production deployments, Redis or equivalent shared state is required.

### 3.5 Content Security Policy & Frame Protection
- **Frame Protections**: `Content-Security-Policy: frame-ancestors` permits embedding exclusively within authorized developer environments (`https://*.google.com`, `https://*.run.app`, `https://aistudio.google.com`, `'self'`), blocking clickjacking from untrusted third-party origins.
- **Modern Standards**: Obsolete `X-XSS-Protection` headers are omitted per modern W3C/OWASP guidance, relying instead on strict CSP, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`.
- **Zero Secret Exposure in Responses**: Detailed error logs, stack traces, and database connection strings are confined to server-side logging; clients receive only structured `{ status, code, message, requestId }`.

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

---

## 5. Synthetic Banking Environment & Scope of Operation

- **Synthetic Environment**: COREvia is an institutional core banking relationship management demonstration and architectural platform.
- **Zero Real Banking Connectivity**: Deploying this application does **not** establish connectivity to real banking networks, payment clearing switches (UPI, IMPS, NEFT, RTGS), UIDAI/cKYC registries, or credit bureaus.
- **Synthetic Data Isolation**: All customer profiles (such as Rahul Sharma `CUS-10482`), accounts, transactions, and credit facilities reside strictly on a synthetic Indian banking dataset.
- **Human-in-the-Loop Gate**: Controlled AI actions always enforce human confirmation and maker-checker approvals before any database state mutation.

