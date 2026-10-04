# COREvia Decision Trace API Specification

## Base URL
`/api/decision-traces`

All requests require an active authenticated session cookie and anti-CSRF token on mutating requests (`POST`).

---

## 1. Endpoints

### 1.1 List Decision Traces
- **Route**: `GET /api/decision-traces`
- **Query Params**:
  - `customerId` (optional, integer): Filter traces by customer ID
  - `sourceEngine` (optional, string): Filter by engine (`CORE_SCORE`, `NBA`, `RADAR`, `SIGNAL_CENTER`, etc.)
  - `decisionType` (optional, string): Filter by type (`RECOMMENDATION`, `RISK_FLAG`, `SCORE_CHANGE`, etc.)
  - `status` (optional, string): Filter by status (`PENDING_REVIEW`, `CONFIRMED`, `REJECTED`, `EXECUTED`)
  - `limit` (optional, integer, default: 50)
  - `offset` (optional, integer, default: 0)
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "decisionId": "DT-20260928-00101",
      "customerId": 1,
      "sourceEngine": "CORE_SCORE",
      "decisionType": "SCORE_CHANGE",
      "decisionMode": "DETERMINISTIC",
      "modelVersion": "rules-v4.2.1",
      "title": "CORE Score Downward Adjustment (780 -> 710)",
      "summary": "Customer score dropped by 70 points due to high-value service ticket dispute.",
      "primaryRationale": "Unresolved transaction failure exceeding 72h SLA with high customer churn probability.",
      "confidence": null,
      "status": "PENDING_REVIEW",
      "createdAt": "2026-09-28T09:00:00.000Z"
    }
  ]
}
```

---

### 1.2 Get Decision Trace Analytics
- **Route**: `GET /api/decision-traces/analytics`
- **Response**:
```json
{
  "success": true,
  "data": {
    "totalTraces": 5,
    "pendingReview": 3,
    "confirmed": 1,
    "rejected": 0,
    "executed": 1,
    "engineBreakdown": {
      "CORE_SCORE": 1,
      "NBA": 1,
      "RADAR": 1,
      "SIGNAL_CENTER": 1,
      "TRADE_FINANCE": 1
    }
  }
}
```

---

### 1.3 Search Decision Traces
- **Route**: `GET /api/decision-traces/search?q={query}`
- **Response**: Returns matching decision traces by code, title, summary, or rationale.

---

### 1.4 Get Trace Details
- **Route**: `GET /api/decision-traces/:id`
- **Parameters**: `:id` - Integer ID or Decision Code (e.g. `DT-20260928-00101`)
- **Response**: Complete `DecisionTraceDTO` object with evidence, source nodes, and calculated freshness.

---

### 1.5 Get Trace Granular Evidence
- **Route**: `GET /api/decision-traces/:id/evidence`
- **Response**:
```json
{
  "success": true,
  "data": {
    "primary": [
      {
        "id": 1,
        "evidenceType": "SERVICE_TICKET",
        "title": "Ticket #SR-4921 Unresolved (>72h)",
        "description": "UPI debit dispute of ₹45,000 pending merchant credit.",
        "weight": "HIGH",
        "contributionType": "NEGATIVE",
        "isPrimary": true
      }
    ],
    "supporting": [
      {
        "id": 2,
        "evidenceType": "TRANSACTION_PATTERN",
        "title": "Clean CASA Payment History",
        "description": "Zero cheque bounces or overdraft incidents over 24 months.",
        "weight": "MEDIUM",
        "contributionType": "POSITIVE",
        "isPrimary": false
      }
    ]
  }
}
```

---

### 1.6 Get Trace Source Nodes & Freshness
- **Route**: `GET /api/decision-traces/:id/sources`
- **Response**: Array of source nodes with `freshnessTimestamp` and real-time calculated freshness duration.

---

### 1.7 Get Customer Decision History
- **Route**: `GET /api/decision-traces/:id/history`
- **Parameters**: `:id` - Customer ID or Decision Code
- **Response**: Chronological history of decision traces for the associated customer.

---

### 1.8 Compare Decision Traces (Same Customer Only)
- **Route**: `GET /api/decision-traces/:id/compare/:otherId`
- **Security**: Returns `400 Bad Request` if traces belong to different customers.
- **Response**: Side-by-side comparison including common, added, and removed evidence, plus confidence and status deltas.

---

### 1.9 Human Governance Actions
- **Confirm**: `POST /api/decision-traces/:id/confirm`
  - Body: `{ "notes": "Approved by branch manager" }`
- **Reject**: `POST /api/decision-traces/:id/reject`
  - Body: `{ "rejectionReason": "Customer opted out of FD allocation" }`
- **Execute**: `POST /api/decision-traces/:id/execute`
  - Body: `{ "executionRef": "TXN-8849102", "notes": "Disbursed via core switch" }`

---

## 2. Strategy Simulator API Specification

### Base URL
`/api/strategy-scenarios`

### 2.1 List Scenarios
- **Route**: `GET /api/strategy-scenarios`
- **Query Params**: `status`, `limit`, `offset`
- **Response**: Paginated list of strategy scenarios.

### 2.2 Get Simulator Analytics
- **Route**: `GET /api/strategy-scenarios/analytics`
- **Response**: Aggregated scenario metrics, simulation counts, most common action frequencies, user activity.

### 2.3 Search Scenarios
- **Route**: `GET /api/strategy-scenarios/search?q=query`
- **Response**: Scenarios matching code, title, or customer name.

### 2.4 Customer Scenarios
- **Route**: `GET /api/strategy-scenarios/customer/:customerId`
- **Response**: All scenarios created for the designated customer.

### 2.5 Run Ad-Hoc Simulation
- **Route**: `POST /api/strategy-scenarios/simulate-adhoc`
- **Body**: `{ "customerId": 1, "actions": [{ "actionType": "RESOLVE_SERVICE_CASE", "orderIndex": 1, "parameters": {} }] }`
- **Response**: `StrategySimulationResultDTO` with intermediate steps, comparison table, why factors, limitations, and `isSimulation: true`.

### 2.6 Create Scenario
- **Route**: `POST /api/strategy-scenarios`
- **Body**: `{ "customerId": 1, "name": "Service Recovery", "description": "...", "actions": [...] }`
- **Response**: Created `StrategyScenarioDTO`.

### 2.7 Get Scenario (with Staleness Check)
- **Route**: `GET /api/strategy-scenarios/:id`
- **Response**: `StrategyScenarioDTO` with `isStale` flag evaluated against customer updated timestamp.

### 2.8 Simulate Existing Scenario
- **Route**: `POST /api/strategy-scenarios/:id/simulate`
- **Response**: Updated `StrategyScenarioDTO` with status `SIMULATED` and fresh result snapshot.

### 2.9 Save Scenario
- **Route**: `POST /api/strategy-scenarios/:id/save`
- **Response**: Updated `StrategyScenarioDTO` with status `SAVED`.

### 2.10 Archive Scenario
- **Route**: `POST /api/strategy-scenarios/:id/archive`
- **Response**: Updated `StrategyScenarioDTO` with status `ARCHIVED`.

### 2.11 Compare Scenarios (Same Customer)
- **Route**: `GET /api/strategy-scenarios/:id/compare/:otherId`
- **Response**: Side-by-side metric comparison table, advantages (`BASE`/`TARGET`), common and unique actions. Strictly blocks cross-customer comparison.

### 2.12 Apply Simulated Action to Real Banking
- **Route**: `POST /api/strategy-scenarios/:id/apply-action`
- **Body**: `{ "actionIndex": 0, "confirmationNotes": "Confirmed by client during review" }`
- **Response**: `{ "success": true, "executedAction": "SCHEDULE_RELATIONSHIP_REVIEW", "entityId": "12", "message": "..." }`
- **Security**: Requires explicit banker notes and logs `STRATEGY_SIMULATION_ACTION_APPLIED`.

---

## 3. Customer Journey Orchestrator & Lifecycle API Specification (Phase 33)

### Base URL
`/api/journeys`

### 3.1 Get Journey Templates
- **Route**: `GET /api/journeys/templates`
- **Response**: Array of 10 standard lifecycle journey templates with default steps, SLAs, and evidence schemas.

### 3.2 Portfolio Journey Analytics
- **Route**: `GET /api/journeys/analytics`
- **Security**: Scoped to assigned customers for Relationship Managers; institution-wide for Admins/Branch Managers.
- **Response**: Aggregated active, completed, blocked, and at-risk journeys, SLA compliance rate, duration averages, and top bottleneck steps.

### 3.3 List Customer Journeys
- **Route**: `GET /api/journeys`
- **Query Params**: `customerId`, `status`, `priority`, `slaStatus`, `journeyType`, `search`, `limit`, `offset`
- **Response**: Paginated list of journeys with customer summaries, progress percentages, and current step indicators.

### 3.4 Get Journey Details
- **Route**: `GET /api/journeys/:id`
- **Parameters**: `:id` - Journey Primary Key or unique Journey Code (e.g. `JRN-2026-10482-01`)
- **Response**: Comprehensive `CustomerJourneyDTO` with ordered steps, SLA status, blocker details, progress calculation, timeline events, and terminal outcomes.

### 3.5 Create Customer Journey
- **Route**: `POST /api/journeys`
- **Body**: `{ "customerId": 1, "templateCode": "KYC_COMPLETION", "priority": "HIGH", "name": "...", "ownerId": 3 }`
- **Response**: Instantiated `CustomerJourneyDTO` with initial steps cascaded (`Step 1 READY`, subsequent steps `PENDING`).

### 3.6 Update Journey Step
- **Route**: `PATCH /api/journeys/:journeyId/steps/:stepId`
- **Body**: `{ "status": "COMPLETED", "completionEvidence": { "evidenceType": "KYC_RECORD", "entityId": "1", "summary": "PAN verified" } }`
- **State Machine**: Transitions step through `PENDING` -> `READY` -> `IN_PROGRESS` -> `COMPLETED`/`BLOCKED`. Rejects premature transitions if prerequisites are unmet. Cascades dependent steps to `READY`.

### 3.7 Handoff Journey Ownership
- **Route**: `POST /api/journeys/:id/handoff`
- **Body**: `{ "targetUserId": 4, "targetRole": "COMPLIANCE_OFFICER", "reason": "Dual control checker review required" }`
- **Response**: Updated journey with new owner and audit trail (`JOURNEY_OWNER_CHANGED`).

### 3.8 Escalate Journey
- **Route**: `POST /api/journeys/:id/escalate`
- **Body**: `{ "escalateToUserId": 4, "reason": "SLA deadline breached due to external registry downtime", "urgency": "HIGH" }`
- **Response**: Updated journey in `ESCALATED` status with linked Decision Trace record (`DT-...`).

### 3.9 Record Final Journey Outcome
- **Route**: `POST /api/journeys/:id/outcome`
- **Body**: `{ "outcomeType": "GOAL_MET", "summary": "All account activation milestones achieved", "evidence": {} }`
- **Response**: Immutable `JourneyOutcome` record; parent journey transitions to terminal `COMPLETED` status.

---

## 4. Household & Business Group 360 API Specification (Phase 34)

### Base URL
`/api/groups`

All endpoints enforce dual authorization (Group Authorization + Per-Member Resource Authorization).

### 4.1 Portfolio Group Analytics
- **Route**: `GET /api/groups/analytics`
- **Security**: Scoped to assigned groups/customers for Relationship Managers; institution-wide for Admins and Branch Managers.
- **Response**: Total groups, household count, business group count, aggregated relationship value, average members per group, and top groups.

### 4.2 List Relationship Groups
- **Route**: `GET /api/groups`
- **Query Params**:
  - `groupType`: Filter by `HOUSEHOLD`, `BUSINESS`, `BUSINESS_GROUP`
  - `status`: `ACTIVE`, `INACTIVE`, `UNDER_REVIEW`, `ARCHIVED`
  - `ownerId`: Filter by primary Relationship Manager ID
  - `search`: Query matching `groupId`, `name`, or `displayName`
  - `limit`: Page limit (default: 50)
  - `offset`: Page offset
- **Response**: Array of `RelationshipGroupDTO` with member counts and primary entity summaries.

### 4.3 Create Relationship Group
- **Route**: `POST /api/groups`
- **RBAC**: Requires `ADMINISTRATOR`, `BRANCH_MANAGER`, or `RELATIONSHIP_MANAGER` with `groups:write`.
- **Body**:
  ```json
  {
    "groupId": "HH-10482",
    "groupType": "HOUSEHOLD",
    "name": "Sharma Family Household",
    "displayName": "Sharma Family",
    "description": "Private banking household relationship",
    "primaryCustomerId": 1,
    "primaryBusinessId": "BIZ-10482",
    "relationshipManagerId": 2,
    "metadata": {}
  }
  ```
- **Response**: `201 Created` with full `RelationshipGroupDTO`.

### 4.4 Get Single Group Details
- **Route**: `GET /api/groups/:id`
- **Parameters**: `:id` - Numeric primary key or unique group identifier (e.g. `HH-10482`, `BIZ-10482`)
- **Response**: Comprehensive `RelationshipGroupDTO` containing embedded `members` list and multidimensional `profile`.

### 4.5 Update Relationship Group
- **Route**: `PUT /api/groups/:id`
- **Body**: `{ "name": "...", "displayName": "...", "status": "ACTIVE", "description": "..." }`
- **Response**: Updated `RelationshipGroupDTO`.

### 4.6 Controlled Ownership Handoff
- **Route**: `POST /api/groups/:id/handoff`
- **Body**: `{ "targetUserId": 3, "reason": "Branch coverage rebalancing" }`
- **Audit**: Emits `GROUP_OWNER_CHANGED` with previous and new RM IDs.

### 4.7 Group Members Management
- **`GET /api/groups/:id/members`**: Retrieves members with strict per-member privacy filtering. Unauthorized members have `name: "Protected Member (Restricted Access)"` and nulled financial fields.
- **`POST /api/groups/:id/members`**: Adds a verified member (`entityType`: `CUSTOMER` | `BUSINESS`). Validates customer existence and allowable `relationshipType`.
- **`DELETE /api/groups/:id/members/:memberId`**: Removes an entity from group membership.

### 4.8 Multidimensional Group Profile
- **Route**: `GET /api/groups/:id/profile`
- **Aggregation Rules**:
  - `relationshipValue`: Sum of valid, authorized member values (`formattedValue: "₹61.2L"`). If unpopulated, returns `"Unavailable"`. Never estimated.
  - `coreProfile`: Distributions (`minScore`, `maxScore`, `averageScore`, score buckets). Never invents a fake single "Group CORE Score".
  - `productDepth`: Deduplicated unique products vs total relationships to prevent double-counting.
  - `serviceHealth`: SLA breakdown (`openCases`, `criticalCases`, `atRiskCases`, `breachedCases`).
  - `opportunities`: Pipeline aggregation without fabricated revenue forecasts.
  - `activeJourneys`: Phase 33 lifecycle journey states.

### 4.9 Group Activity & Lineage Endpoints
- **`GET /api/groups/:id/timeline`**: Chronological events across authorized members retaining entity attribution (`INTERACTION-12`, `CASE-4`, `JOURNEY-2`).
- **`GET /api/groups/:id/relationships`**: Phase 28 relationship graph edges connecting group entities.
- **`GET /api/groups/:id/evidence`**: Audited relationship evidence with provenance documents and timestamps.
- **`GET /api/groups/:id/journeys`**: Active, blocked, and completed Phase 33 journeys for authorized members.
- **`GET /api/groups/:id/opportunities`**: Pipeline opportunities for authorized entities.
339: - **`GET /api/groups/:id/service`**: Service desk tickets across group members.
340: - **`GET /api/groups/:id/signals`**: Phase 28/29 Signal Center alerts attached to authorized entities.
341: 
342: ---
343: 
344: ## 5. Trust & Governance Center API Specification (Phase 35)
345: 
346: ### Base URL
347: `/api/governance`
348: 
349: ### 5.1 Enterprise Governance Overview
350: - **Route**: `GET /api/governance/overview`
351: - **RBAC**: Requires `GOVERNANCE_VIEW`
352: - **Response**: `GovernanceOverviewDTO` with live `systemStatus` (`OPERATIONAL`, `ATTENTION_REQUIRED`, `CRITICAL`), audit event counts, AI/Copilot session counts, agent plans, pending approvals, security events, data requests, open exceptions, and model config (with secret masked).
353: 
354: ### 5.2 Audit Explorer & Tamper-Evident Verification
355: - **Route**: `GET /api/governance/audit`
356: - **Query Params**: `actorId`, `role`, `action`, `module`, `customerId`, `groupId`, `severity`, `limit`, `offset`, `verifyChain` (`true`/`false`)
357: - **RBAC**: Requires `GOVERNANCE_AUDIT_VIEW`
358: - **Response**: Paginated audit events with `previousHash`, `recordHash`, and optional `chainIntegrity` verification (`chainValid: boolean`, `verifiedCount: number`).
359: 
360: ### 5.3 Single Audit Record Details
361: - **Route**: `GET /api/governance/audit/:id`
362: - **RBAC**: Requires `GOVERNANCE_AUDIT_VIEW`
363: - **Response**: Granular audit record with full authorization context, related decision trace, related agent plan, related journey, and related group.
364: 
365: ### 5.4 AI Governance & Source Classification
366: - **Route**: `GET /api/governance/ai`
367: - **RBAC**: Requires `GOVERNANCE_AI_VIEW`
368: - **Response**: `AIGovernanceDTO` with Copilot session counts, tool call telemetry, source classification breakdown (`DETERMINISTIC`, `AI_GENERATED`, `HYBRID`, `SYSTEM_RULE`), mutation proposals, fallback telemetry, and safe Gemini configuration.
369: 
370: ### 5.5 Agent Governance
371: - **Route**: `GET /api/governance/agents`
372: - **RBAC**: Requires `GOVERNANCE_AGENT_VIEW` (scoped by user portfolio)
373: - **Response**: `AgentGovernanceDTO` with agent activity metrics (created, approved, rejected, completed, partial, failed, expired) and recent plans with step status details.
374: 
375: ### 5.6 Access Governance
376: - **Route**: `GET /api/governance/access`
377: - **RBAC**: Requires `GOVERNANCE_VIEW`
378: - **Response**: `AccessGovernanceDTO` with login/logout events, authorization failures, customer/group access logs, and administrative actions.
379: 
380: ### 5.7 Security Center & Active Sessions
381: - **Route**: `GET /api/governance/security`
382: - **RBAC**: Requires `GOVERNANCE_SECURITY_VIEW` (Admin, Compliance)
383: - **Response**: `SecurityGovernanceDTO` with failed login counts, authorization failures, expired sessions, active sessions, and neutral security configuration warnings.
384: 
385: ### 5.8 Data Governance & Lineage
386: - **Route**: `GET /api/governance/data`
387: - **RBAC**: Requires `GOVERNANCE_DATA_VIEW`
388: - **Response**: `DataGovernanceDTO` with context access events, search access, decision evidence queries, and lineage representation.
389: 
390: ### 5.9 Intelligence Data Lineage Graph
391: - **Route**: `GET /api/governance/lineage`
392: - **RBAC**: Requires `GOVERNANCE_DATA_VIEW`
393: - **Response**: Graph nodes (`CUSTOMER RECORD` → `INTERACTION DATA` → `SERVICE DATA` → `CORE SCORE` → `RELATIONSHIP INTELLIGENCE` → `NEXT BEST ACTION` → `DECISION TRACE` → `AGENT PLAN` → `ACTION` → `AUDIT`) with edges and node classifications (`SOURCE`, `DERIVED`, `SIMULATED`, `AI_EXPLANATION`, `HUMAN_ACTION`).
394: 
395: ### 5.10 Approval Center
396: - **Route**: `GET /api/governance/approvals`
397: - **RBAC**: Requires `GOVERNANCE_VIEW`
398: - **Response**: `ApprovalCenterDTO` with pending approvals across agent plans, journey escalations, group ownership transfers, and sensitive operations.
399: 
400: ### 5.11 Decision Governance
401: - **Route**: `GET /api/governance/decisions`
402: - **RBAC**: Requires `GOVERNANCE_VIEW`
403: - **Response**: `DecisionGovernanceDTO` with Decision Trace count, evidence availability, source engine distribution, decision modes, and human review stats.
404: 
405: ### 5.12 Export Activity Tracking
406: - **Route**: `GET /api/governance/exports`
407: - **RBAC**: Requires `GOVERNANCE_EXPORT_VIEW`
408: - **Response**: `ExportGovernanceDTO` with lightweight export logs, data exfiltration alerts, actor, dataset, and filter scope.
409: 
410: ### 5.13 System Health
411: - **Route**: `GET /api/governance/health`
412: - **RBAC**: Requires `GOVERNANCE_VIEW`
413: - **Response**: `SystemHealthDTO` with genuine live PostgreSQL latency test, Gemini connectivity, authentication status, notifications, and search status (`HEALTHY`, `DEGRADED`, `UNAVAILABLE`, `NOT_CONFIGURED`).
414: 
415: ### 5.14 Governance Exceptions List
416: - **Route**: `GET /api/governance/exceptions`
417: - **Query Params**: `status`, `severity`, `category`, `limit`, `offset`
418: - **RBAC**: Requires `GOVERNANCE_VIEW`
419: - **Response**: Paginated list of `GovernanceExceptionDTO` records.
420: 
421: ### 5.15 Governance Exception Lifecycle Mutations
422: - **`POST /api/governance/exceptions/:id/acknowledge`**: Mark exception `UNDER_REVIEW`.
423: - **`POST /api/governance/exceptions/:id/assign`**: Body `{ "assignedTo": "SEC-OPS-1" }`. Emits notification and audit event.
424: - **`POST /api/governance/exceptions/:id/resolve`**: Body `{ "resolution": "..." }`. Marks exception `RESOLVED`.
425: - **`POST /api/governance/exceptions/:id/dismiss`**: Body `{ "reason": "..." }`. Marks exception `DISMISSED`.
426: - **RBAC**: Requires `GOVERNANCE_EXCEPTION_MANAGE` (Admin, Compliance). Emits audit log for every mutation.

---

## 6. Enterprise Integration & API Gateway Endpoints (Phase 38)

### 6.1 Integration Registry
- **`GET /api/integrations`**: List all registered integrations (Core Banking, KYC, Document Management, Payments, Notifications). Supports `domain`, `mode`, `status`, and `search` query parameters.
- **`GET /api/integrations/:id`**: Retrieve integration metadata, adapter specification, health history, and circuit breaker configuration.
- **`GET /api/integrations/summary`**: Aggregated overview metrics (Total Integrations, Active Simulators, 24h Events, Success Rate, Average Latency, Circuit Breakers).
- **`PATCH /api/integrations/:id/status`**: Update operational state (`CONFIGURED`, `AVAILABLE`, `DISABLED`, `DEGRADED`, `FAILED`). Strictly blocks setting unverified adapters to `CONNECTED`.
- **`POST /api/integrations/:id/health-check`**: Trigger on-demand health/connectivity check. Returns latency and explicit `SIMULATOR_HEALTHY` status for synthetic adapters.

### 6.2 Internal Gateway Execution & Idempotency
- **`POST /api/integrations/:id/execute`**: Governed operation execution through internal adapter.
  - **Headers**: Supports `Idempotency-Key` for mutation safety.
  - **Body**: `{ "operation": "getBalance", "payload": { "accountNumber": "10482001" } }`.
  - **Behavior**: Verifies permissions, computes request hash, checks circuit breaker state, enforces rate limits, bounds timeouts, and sanitizes payload telemetry in event logs.
  - **Idempotency Replay**: Replaying exact request returns cached response. Mismatched payload with identical key returns `422 Unprocessable Entity`.

### 6.3 Registered API Endpoints
- **`GET /api/integrations/endpoints/all`**: Returns controlled integration endpoint specifications (`EP-CB-01`, `EP-PAY-01`, etc.) including method, purpose, auth type, rate limit, timeout, and idempotency requirements.

### 6.4 Webhooks & Delivery Management
- **`GET /api/integrations/webhooks/all`**: List registered webhooks with HMAC-SHA256 secret metadata.
- **`POST /api/integrations/webhooks`**: Create new webhook subscription with generated signing secret.
- **`POST /api/integrations/webhooks/:webhookId/test`**: Trigger simulated synthetic webhook event dispatch.
- **`GET /api/integrations/deliveries/all`**: List delivery attempts, status (`DELIVERED`, `FAILED`, `RETRYING`, `EXHAUSTED`), HTTP response status, latency, and correlation IDs.
- **`POST /api/integrations/deliveries/:deliveryId/retry`**: Bounded manual retry of retryable delivery failures (max 3 attempts).

### 6.5 Credentials & API Keys
- **`POST /api/integrations/:id/api-keys`**: Generate secure service token. Raw secret is displayed once in the response; only the SHA-256 hash and truncated prefix are stored in PostgreSQL.

### 6.6 Telemetry & Audit
- **`GET /api/integrations/events/all`**: Query integration event stream with masked PAN, Aadhaar, and secret tokens.
- **`GET /api/integrations/failures/all`**: List active integration errors with error classification (`TIMEOUT`, `NETWORK_ERROR`, `VALIDATION_ERROR`, etc.) and retryability status.

---

## 7. Enterprise Administration & Governance Center API Specification (Phase 39)

### Base URL
`/api/admin`

All endpoints under `/api/admin` enforce `requireAuth` and `requireRole('ADMINISTRATOR')`. Unauthorized calls return `401 Unauthorized` or `403 Forbidden`.

### 7.1 Control Plane Overview
- **Route**: `GET /api/admin/overview`
- **Response**: Derived institutional metrics (`activeUsers`, `inactiveUsers`, `activeSessions`, `failedLoginAttempts`, `authorizationFailures`, `openExceptions`, `securityEvents`, `activeIntegrations`, `failedIntegrations`, `enabledFeatureFlags`, `runningJobs`, `failedJobs`).

### 7.2 User Administration
- **`GET /api/admin/users`**: Query user roster. Supports `status`, `role`, `department`, `search`, `limit`, `offset`.
- **`GET /api/admin/users/:id`**: Comprehensive user profile with identity, employment, roles, effective permissions, resource scopes, active sessions, and audit history. Zero password/hash disclosure.
- **`PATCH /api/admin/users/:id/status`**: Update user status (`ACTIVE`, `INACTIVE`, `LOCKED`, `SUSPENDED`).
  - **Body**: `{ "status": "INACTIVE", "reason": "Employee leaves on sabbatical" }`
  - **Invariants**: Blocks self-deactivation (`ADMIN_CANNOT_DEACTIVATE_SELF`); purges all active user sessions immediately upon deactivation.

### 7.3 Roles & Permissions
- **`GET /api/admin/roles`**: List system roles (`ADMINISTRATOR`, `BRANCH_OPS_HEAD`, `MAKER`, `RELATIONSHIP_MANAGER`, `COMPLIANCE_OFFICER`, etc.) with user counts and descriptions.
- **`GET /api/admin/permissions`**: Categorized permission catalog grouped by 15 domains (`CUSTOMERS`, `ACCOUNTS`, `LOANS`, `PRODUCTS`, `SERVICE`, `OPPORTUNITIES`, `TASKS`, `ANALYTICS`, `COPILOT`, `OPERATIONS`, `INTEGRATIONS`, `DOCUMENTS`, `ONBOARDING`, `GOVERNANCE`, `ADMIN`).

### 7.4 Resource Scopes
- **`GET /api/admin/scopes`**: Aggregated access scopes by branch, department, RM portfolio, customer, and organization.

### 7.5 Session Management
- **`GET /api/admin/sessions`**: List active sessions with masked tokens, user metadata, IP address, user agent, and expiration.
- **`DELETE /api/admin/sessions/:id`**: Revoke a specific active browser session with audit tracking.
- **`DELETE /api/admin/sessions/user/:userId`**: Revoke all active sessions for a target user across all devices.

### 7.6 Security Events & Login Activity
- **`GET /api/admin/security-events`**: Paginated security telemetry (`AUTH_FAILURE`, `AUTHORIZATION_FAILURE`, `IDOR_ATTEMPT`, `RATE_LIMIT`, `CSRF_FAILURE`, `SUSPICIOUS_SESSION`). Supports `type`, `severity`, `limit`, `offset`.
- **`GET /api/admin/security-events/:id`**: Detailed security event drawer metadata with sanitized evidence.
- **`GET /api/admin/login-activity`**: Authentication logs (`SUCCESS`, `FAILURE`, `LOGOUT`, `LOCKOUT`, `SESSION_EXPIRED`).

### 7.7 AI & Copilot Governance
- **`GET /api/admin/ai-governance`**: Safe Gemini configuration state (`CONFIGURED` / `AVAILABLE` / `MISSING`), model name, fallback state, tool breakdown, and action proposals vs confirmations. Zero API key disclosure.

### 7.8 Integration Administration
- **`GET /api/admin/integrations`**: Integration summary reflecting Phase 38 registry, health status, and failure counts.

### 7.9 Notifications & SLA Policies
- **`GET /api/admin/notifications`**: Notification categories, delivery policies, and deduplication rules.
- **`GET /api/admin/sla-policies`**: Configured SLA thresholds across Service, Task, Document, KYC, Approval, Operations, and Journey.

### 7.10 Feature Flags
- **`GET /api/admin/feature-flags`**: List governed feature flags (`COPILOT_ENABLED`, `INTEGRATIONS_ENABLED`, etc.) with environment, rollout scope, and owner.
- **`PATCH /api/admin/feature-flags/:key`**: Toggle or configure feature flag.
  - **Body**: `{ "enabled": true, "reason": "Enabling Copilot for staging validation" }`
  - **Invariant**: Strictly blocks attempts to disable security controls (`SECURITY_CONTROLS_CANNOT_BE_DISABLED_BY_FEATURE_FLAGS`).

### 7.11 System Configuration & Database Health
- **`GET /api/admin/system-config`**: Safe platform configuration metadata (environment, versions, build, migration state). Zero raw environment variables.
- **`GET /api/admin/database-health`**: Database connection latency, pool status, and migration state. No arbitrary SQL execution permitted.

### 7.12 Background Jobs
- **`GET /api/admin/jobs`**: Operational status of scheduled workers, batch settlement queues, and maintenance listeners.

### 7.13 Maintenance Mode
- **`GET /api/admin/maintenance`**: Maintenance mode status, start time, expected duration, and reason.
- **`POST /api/admin/maintenance`**: Toggle platform maintenance mode with audit logging. Preserves administrator access to prevent lockout.

### 7.14 Tamper-Evident Audit Center
- **`GET /api/admin/audit`**: Enterprise audit log stream with pagination, filters, and SHA-256 hashes.
- **`POST /api/admin/audit/verify-integrity`**: On-demand SHA-256 hash chaining verification across consecutive records.

### 7.15 Governance Exceptions
- **`GET /api/admin/governance-exceptions`**: Open and historical governance violations and anomalies.



