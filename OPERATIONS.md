# COREvia Operations Runbook

## High Error Rate or Latency Spikes
**Symptoms**: Users report slow page loads, or monitoring shows increased 5xx responses.
**Checks**:
1. Check CPU and Memory utilization of application containers.
2. Check database connection pool limits.
3. Review APM/Metrics for slow queries.
**Action**: If CPU bound, scale out containers. If DB connection bound, adjust pool size or investigate long-running analytical queries.

## Application Won't Start (Crash Loop)
**Symptoms**: New deployment fails to become healthy; container restarts continuously.
**Checks**:
1. Check container logs for `CRITICAL ERROR: Missing required environment variables`.
2. Ensure database host is reachable from the new container instance.
**Action**: Fix the missing environment variables in the secret manager or rollback to previous deployment.

## Failed Database Migration
**Symptoms**: `db:migrate` script fails during deployment pipeline.
**Checks**:
1. Review the migration error log for syntax errors or constraint violations.
**Action**: Do not deploy the application code if migration fails. Rollback the database manually if the migration was partially applied (or rely on transactional DDL if supported). Fix the schema definitions and retry.

## Credential Rotation
**Procedure**:
1. Generate the new secret (e.g., new `GEMINI_API_KEY`).
2. Update the value in the cloud secret manager.
3. Perform a rolling restart of the COREvia application containers to inject the new environment variable.
4. Verify the application is healthy.
5. Invalidate/Delete the old secret.

## Maintenance Mode
If you need to take the system offline for critical maintenance:
34: 1. Set `MAINTENANCE_MODE=true` in the environment configuration.
35: 2. (Requires explicit implementation in ingress or app layer to serve a 503 Maintenance page).
36: 
37: ## Trust & Governance Center Operations (Phase 35)
38: 
39: ### 1. Audit Chain Integrity Verification
40: **Symptoms**: Compliance or Auditor flags audit discrepancies or manual database edit suspicion.
41: **Checks**:
42: 1. Navigate to `/governance` -> **Audit Explorer** tab.
43: 2. Run chain integrity verification via UI or execute `GET /api/governance/audit?verifyChain=true`.
44: 3. If `chainValid: false`, review `brokenAtIndex` to pinpoint the altered or deleted database row.
45: **Action**: Quarantine the compromised node, review database WAL logs for direct manual SQL modifications, and notify the Security & Compliance committee.
46: 
47: ### 2. Governance Exceptions Management
48: **Symptoms**: Open exceptions in `/governance` -> **Exceptions** tab or notifications (`CRITICAL_SECURITY_EVENT`, `HIGH_AUTHORIZATION_FAILURE`).
49: **Procedure**:
50: 1. Inspect exception details (`category`, `severity`, `resourceType`, `resourceId`, `description`).
51: 2. Click **Acknowledge** (`POST /api/governance/exceptions/:id/acknowledge`) to update status to `UNDER_REVIEW`.
52: 3. Assign to specialized engineer/team (`POST /api/governance/exceptions/:id/assign`).
53: 4. Once rectified, submit structured resolution notes (`POST /api/governance/exceptions/:id/resolve`).
54: 
55: ### 3. Gemini Fallback & Model Status
56: **Symptoms**: Governance Overview reports `AI Fallbacks` or Gemini `NOT_CONFIGURED` / `UNAVAILABLE`.
57: **Checks**:
58: 1. Check `/governance` -> **AI Governance** tab or **System Health** tab.
59: 2. Verify `GEMINI_API_KEY` presence in secret store without logging secrets.
60: 3. Ensure deterministic fallbacks remain active so banking core operations are unblocked.

