# COREvia Incident Response & Operations Runbook

This runbook outlines mandatory operational triage protocols and recovery procedures for system incidents on the COREvia platform.

---

## 1. Incident Severity Definitions

- **SEV-1 (Critical Outage / Breach)**: Complete platform unavailability, database connectivity outage, confirmed credential compromise, or active data corruption.
- **SEV-2 (High Degradation)**: Core banking module failure, authentication disruption, or integration switch circuit breaker trip.
- **SEV-3 (Moderate / Warning)**: Degraded non-critical service (e.g. Gemini AI Copilot offline in fallback mode, elevated rate-limit throttling).
- **SEV-4 (Low / Advisory)**: Single-user issue, minor cosmetic discrepancy, or scheduled maintenance alert.

---

## 2. Standard Operating Procedures (SOPs)

### Procedure 1: Application Unavailable (502 / 503 / Crash Loop)
1. **Diagnosis**: Check process status and logs:
   ```bash
   # Check if process is listening
   curl -I http://localhost:3000/api/health
   ```
2. **Review Error Logs**: Check for `EADDRINUSE` (port conflict) or `CRITICAL: Server startup aborted` (missing production env variables).
3. **Remediation**:
   - If port occupied: rebind to another port via `PORT=3001 npm run start` or terminate the conflicting process.
   - If env validation failed: review `SESSION_SECRET` (min 32 chars) and `APP_URL` in `.env`.
   - Restart server via `npm run start`.

### Procedure 2: Database Unavailable (Connection Timeout / Pool Exhaustion)
1. **Diagnosis**: Inspect `/api/health` response. If `status: "DEGRADED"`:
   ```bash
   # Check PostgreSQL service status
   pg_isready -h localhost -p 5432
   ```
2. **Review DB Connection Count**:
   - Query `pg_stat_activity` to inspect open and idle connections.
3. **Remediation**:
   - Restart the PostgreSQL engine or clear idle connections if pool exhausted.
   - Verify `DATABASE_URL` credentials and network security groups.

### Procedure 3: Authentication Failures Spike
1. **Diagnosis**: Inspect `/api/admin/overview` or query `audit_logs` for `LOGIN_FAILURE`:
   - Check if failures stem from expired passwords, missing users, or brute force attempts.
2. **Remediation**:
   - In-memory rate limiting blocks repeated failed logins per IP/identifier (terminal locked for 5 minutes after 5 consecutive failures).
   - If a valid officer is locked out, verify their user status in `/admin/users` and ensure `status: ACTIVE`.

### Procedure 4: Suspicious Login Activity / Brute Force
1. **Diagnosis**: Inspect `security_events` table for `AUTH_ACCOUNT_LOCKED` or `RATE_LIMIT_EXCEEDED` events.
2. **Remediation**:
   - Identify the source IP address from request correlation headers (`x-forwarded-for`).
   - If malicious ingress is confirmed, block the offending IP address at the reverse proxy or firewall layer (e.g. Cloudflare / WAF).

### Procedure 5: Session Compromise Suspicion
1. **Immediate Quarantine**:
   - Revoke all active sessions for the compromised user account via the Administration workspace (`/admin` -> User Detail -> Revoke All Sessions).
   - Or revoke via API:
     ```http
     DELETE /api/admin/users/:userId/sessions
     ```
2. **Account Lockdown**:
   - Transition user status to `LOCKED` or `SUSPENDED` via `/admin/users/:userId/status`. This atomically purges all active sessions in PostgreSQL.
3. **Audit Log Inspection**:
   - Query `audit_logs` filtered by `actorId` for unauthorized mutations during the suspected timeframe.

### Procedure 6: CORS / CSRF Security Incident
1. **Diagnosis**: Inspect structured server logs for `[WARN][API] CSRF_VALIDATION_FAILED` or `CORS blocked for origin`.
2. **Remediation**:
   - Verify if an untrusted origin is attempting cross-site requests.
   - Confirm that `CORS_ALLOWED_ORIGINS` in `.env` only contains strictly authorized domains.
   - Ensure reverse proxy correctly passes canonical `Origin` and `Host` headers.

### Procedure 7: Gemini AI / Copilot Service Outage
1. **Diagnosis**: Inspect `/governance` -> **AI Governance** tab or server startup logs (`GEMINI: NOT CONFIGURED`).
2. **Remediation**:
   - COREvia is engineered with a **deterministic rule-based fallback**. If the Gemini API is unreachable, Copilot continues to serve deterministic responses without application failure.
   - Verify `GEMINI_API_KEY` validity in secret store. Rotate key if expired.

### Procedure 8: Enterprise Integration Gateway Failure / Circuit Breaker Trip
1. **Diagnosis**: Navigate to `/integrations` and inspect the adapter status matrix.
2. **Circuit Breaker State Machine**:
   - If an adapter (e.g. `INT-PAYMENTS`, `INT-KYC`) trips to `OPEN`, the circuit breaker prevents cascading latency by immediately failing fast.
3. **Remediation**:
   - Review failed webhook delivery logs and dead-letter queues.
   - Once underlying synthetic or external adapter recovers, trigger a test ping (`POST /api/integrations/:id/test`) to advance state to `HALF_OPEN` and reset to `CLOSED`.

### Procedure 9: Unexpected Application Errors (500 Internal Server Error)
1. **Diagnosis**: Query structured logs by `requestId` (returned in the client error payload).
2. **Evidence Preservation**:
   - Check server-side error output for stack trace (stack traces are strictly suppressed from client responses).
3. **Remediation**:
   - If caused by database schema drift, run `npm run db:migrate`.
   - If caused by code regression, revert to last verified build artifact.

### Procedure 10: Data Corruption Suspicion
1. **Diagnosis**: Inspect cryptographic SHA-256 audit chaining via `/governance` -> **Audit Explorer** (`GET /api/governance/audit?verifyChain=true`).
2. **Evidence Preservation**:
   - If `chainValid: false`, record `brokenAtIndex` to identify the tampered record.
   - Take an immediate physical snapshot of the PostgreSQL database before taking corrective action.
3. **Remediation**:
   - Compare database records with external replica or cold backup snapshot.
   - Restore affected records from validated WAL archive or point-in-time recovery (PITR).

---

## 3. Security Incident Protocol Summary

Whenever a security compromise is suspected:
1. **Quarantine**: Revoke sessions immediately via Admin API (`DELETE /api/admin/users/:userId/sessions`).
2. **Disable**: Set user status to `LOCKED` or `SUSPENDED` (atomically terminates all device sessions).
3. **Audit**: Review cryptographic audit logs (`audit_logs`) and security logs (`security_events`).
4. **Rotate**: Rotate affected secrets (`SESSION_SECRET`, `GEMINI_API_KEY`, database passwords).
5. **Preserve**: Never run destructive deletions during an active investigation; preserve logs and WAL records.
6. **Re-authorize**: Only restore access after root cause is identified and remediated.
