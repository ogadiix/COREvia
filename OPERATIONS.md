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
1. Set `MAINTENANCE_MODE=true` in the environment configuration.
2. (Requires explicit implementation in ingress or app layer to serve a 503 Maintenance page).

## Trust & Governance Center Operations (Phase 35)

### 1. Audit Chain Integrity Verification
**Symptoms**: Compliance or Auditor flags audit discrepancies or manual database edit suspicion.
**Checks**:
1. Navigate to `/governance` -> **Audit Explorer** tab.
2. Run chain integrity verification via UI or execute `GET /api/governance/audit?verifyChain=true`.
3. If `chainValid: false`, review `brokenAtIndex` to pinpoint the altered or deleted database row.
**Action**: Quarantine the compromised node, review database WAL logs for direct manual SQL modifications, and notify the Security & Compliance committee.

### 2. Governance Exceptions Management
**Symptoms**: Open exceptions in `/governance` -> **Exceptions** tab or notifications (`CRITICAL_SECURITY_EVENT`, `HIGH_AUTHORIZATION_FAILURE`).
**Procedure**:
1. Inspect exception details (`category`, `severity`, `resourceType`, `resourceId`, `description`).
2. Click **Acknowledge** (`POST /api/governance/exceptions/:id/acknowledge`) to update status to `UNDER_REVIEW`.
3. Assign to specialized engineer/team (`POST /api/governance/exceptions/:id/assign`).
4. Once rectified, submit structured resolution notes (`POST /api/governance/exceptions/:id/resolve`).

### 3. Gemini Fallback & Model Status
**Symptoms**: Governance Overview reports `AI Fallbacks` or Gemini `NOT_CONFIGURED` / `UNAVAILABLE`.
**Checks**:
1. Check `/governance` -> **AI Governance** tab or **System Health** tab.
2. Verify `GEMINI_API_KEY` presence in secret store without logging secrets.
3. Ensure deterministic fallbacks remain active so banking core operations are unblocked.

---

## Banking Operations Workspace (Phase 36)

Route: `/operations`  
Role Access: `ADMINISTRATOR`, `BRANCH_OPS_HEAD`, `MAKER_L2`, `RELATIONSHIP_MANAGER`, `COMPLIANCE_OFFICER`, `BRANCH_MANAGER`, `AUDITOR`, `OPERATIONS`

### 1. Architectural Scope & Purpose
The **Banking Operations Workspace** provides a centralized operational control layer for synthetic banking workflows, separating operational exception handling and dual-control approvals from CRM relationship management.

Key Subsystems:
1. **Maker / Checker Approval Queue**: Enforces strict dual-control segregation of duties. The initiator (Maker) is strictly prohibited from authorizing their own request (`MAKER_CANNOT_SELF_APPROVE`). Checkers inspect evidence and record mandatory compliance notes before approving, rejecting, or returning items.
2. **Operational Exceptions Workspace**: Tracks exceptions across 11 institutional categories (`TRANSACTION`, `KYC`, `DOCUMENT`, `SLA`, `RECONCILIATION`, `WORKFLOW`, `SERVICE`, `ACCOUNT`, `LOAN`, `INTEGRATION`, `SYSTEM`) across 5 severities (`INFO`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
3. **Reconciliation Workspace**: Synthetic reconciliation engine displaying calculated variances (`observed - expected`) between core ledger, vault cash counts, payment switch settlements, and loan sub-ledgers.
4. **Failed Workflow Recovery**: Controlled view of failed customer journey steps and background pipelines, supporting safe, idempotent retries with audit logging.
5. **Operational Tasks Integration**: Real-time integration with the existing enterprise task engine for operations officers.
6. **Operational System Events Stream**: Filterable stream of operational lifecycle events with masking of sensitive details.

### 2. Dual-Control Segregation of Duties
Under institutional banking governance rules:
- **Maker**: Submits requests (e.g., fee reversals, document overrides, limit enhancements, loan adjustments).
- **Checker**: Reviews audit evidence, verifies customer telemetry, and approves, rejects, or returns.
- **Backend Enforcement**: Evaluated in `operations.service.ts`:
  ```ts
  if (existing.makerId === user.id && action === 'APPROVE') {
    throw new BankingError(
      'MAKER_CANNOT_SELF_APPROVE',
      'Dual-control policy violation: Maker cannot self-approve restricted operational actions.',
      403
    );
  }
  ```
- **Frontend Prevention**: The "Approve" button is disabled with an amber policy banner when the active session matches the request's Maker.

### 3. Synthetic Data & Zero Live Payment Integration
All operational records, balances, accounts, and ledger discrepancies are synthetic demonstrations anchored to canonical customers (such as Rahul Sharma `CUS-10482`). No external payment switch, live RTGS/NEFT settlement, or credit bureau is contacted.

### 4. API Endpoints
- `GET /api/operations/summary`: 10 operational metrics backed by database aggregations.
- `GET /api/operations/approvals`: Filtered approvals list.
- `GET /api/operations/approvals/:id`: Detailed approval record.
- `POST /api/operations/approvals`: Create approval request.
- `POST /api/operations/approvals/:id/action`: Checker action (`APPROVE`, `REJECT`, `RETURN`) with mandatory notes.
- `GET /api/operations/exceptions`: Filtered exception list.
- `GET /api/operations/exceptions/:id`: Detailed exception.
- `POST /api/operations/exceptions`: Create exception.
- `POST /api/operations/exceptions/:id/acknowledge`: Acknowledge exception.
- `POST /api/operations/exceptions/:id/assign`: Assign exception to officer.
- `POST /api/operations/exceptions/:id/resolve`: Resolve exception with mandatory notes.
- `GET /api/operations/reconciliation`: Synthetic reconciliation records with calculated variance.
- `POST /api/operations/reconciliation/:id/resolve`: Record balancing voucher reference and resolve.
- `GET /api/operations/failed-workflows`: List failed workflow stages.
- `POST /api/operations/failed-workflows/:id/retry`: Idempotent workflow retry.
- `GET /api/operations/tasks`: Operational tasks requiring officer action.
- `GET /api/operations/events`: Operational system events stream.

### 5. Copilot Controlled Tools
Copilot provides strictly read-only, RBAC-governed operational telemetry:
- `getMyOperationalApprovals`
- `getOperationalExceptions`
- `getOperationalException`
- `getReconciliationRecords`
- `getOperationalTasks`
- `getOperationalEvents`
Copilot is strictly prohibited from mutating or approving operational records autonomously.
