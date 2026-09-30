# COREvia Audit Logging & Regulatory Traceability

## 1. Overview

COREvia enforces an immutable, append-only audit logging architecture designed to satisfy banking compliance norms. Every sensitive operational, administrative, and AI-driven decision event is captured with full context.

---

## 2. Decision Trace Audit Events (Phase 29)

The AI Decision Trace & Explainability Platform introduces dedicated audit event categories:

| Event Type | Trigger Condition | Logged Metadata |
|---|---|---|
| `DECISION_TRACE_CREATED` | New trace recorded by an intelligence engine or rule monitor | `decisionId`, `sourceEngine`, `decisionType`, `customerId` |
| `DECISION_TRACE_VIEWED` | Officer views a decision trace overview or drawer | `decisionId`, `customerId`, `actorId`, `actorRole` |
| `DECISION_TRACE_EVIDENCE_VIEWED` | Officer inspects the granular evidence breakdown | `decisionId`, `evidenceCount`, `primaryEvidenceCount` |
| `DECISION_TRACE_SOURCES_VIEWED` | Officer reviews upstream source systems and data freshness | `decisionId`, `sourceNodeCount` |
| `DECISION_TRACE_ACTION_CONFIRMED` | Officer confirms recommendation for operational execution | `decisionId`, `actorId`, `notes`, previous/new status |
| `DECISION_TRACE_ACTION_REJECTED` | Officer rejects recommendation with mandatory reason | `decisionId`, `actorId`, `rejectionReason`, previous/new status |
| `DECISION_TRACE_ACTION_EXECUTED` | Officer links execution reference (e.g. transaction ID) | `decisionId`, `actorId`, `executionRef`, `notes` |
| `DECISION_TRACE_COMPARED` | Officer runs side-by-side comparison of two customer traces | `baseDecisionId`, `targetDecisionId`, `customerId` |

---

## 3. Strategy Simulator Audit Events (Phase 30)

The Relationship Strategy Simulator & What-If Sandbox introduces tamper-evident audit logging for all scenario lifecycle stages and actual banking executions:

| Event Type | Trigger Condition | Logged Metadata |
|---|---|---|
| `STRATEGY_SCENARIO_CREATED` | Banker creates a new what-if scenario | `scenarioId`, `customerId`, `actionCount`, `createdBy` |
| `STRATEGY_SCENARIO_SIMULATED` | Simulation engine computes multi-action deltas | `scenarioId`, `customerId`, `coreScoreDelta`, `actionCount`, `decisionTraceId` |
| `STRATEGY_SCENARIO_VIEWED` | Banker inspects scenario details or comparison grid | `scenarioId`, `customerId`, `actorId` |
| `STRATEGY_SCENARIO_SAVED` | Scenario transitioned to `SAVED` state | `scenarioId`, `customerId`, `actorId` |
| `STRATEGY_SCENARIO_ARCHIVED` | Scenario transitioned to `ARCHIVED` state | `scenarioId`, `customerId`, `actorId` |
| `STRATEGY_SCENARIO_COMPARED` | Banker compares two scenarios for the same customer | `baseScenarioId`, `targetScenarioId`, `customerId` |
| `STRATEGY_SIMULATION_ACTION_APPLIED` | Banker promotes simulated action to live Core Banking execution | `scenarioId`, `customerId`, `actionType`, `confirmationNotes`, `executedResult` |

---

## 4. Customer Journey Orchestrator Audit Events (Phase 33)

The Customer Journey Orchestrator & Lifecycle Management module captures strict regulatory audit trails for journey governance:

| Event Type | Trigger Condition | Logged Metadata |
|---|---|---|
| `JOURNEY_CREATED` | New journey initiated from a template | `journeyId`, `customerId`, `templateCode`, `ownerId` |
| `JOURNEY_VIEWED` | Officer inspects journey workspace or portfolio view | `journeyId`, `actorId`, `requestId` |
| `JOURNEY_STEP_UPDATED` | Step transitioned (READY, IN_PROGRESS, COMPLETED, BLOCKED) | `journeyId`, `stepId`, `previousStatus`, `newStatus`, `blockerReason` |
| `JOURNEY_OWNER_CHANGED` | Journey ownership handed off to another officer/role | `journeyId`, `previousOwnerId`, `newOwnerId`, `reason` |
| `JOURNEY_ESCALATED` | Journey escalated due to SLA breach or critical blocker | `journeyId`, `escalatedTo`, `reason`, `decisionTraceId` |
| `JOURNEY_OUTCOME_RECORDED` | Final milestone outcome recorded (GOAL_MET, CANCELLED, etc.) | `journeyId`, `outcomeType`, `summary`, `evidence` |

---

## 5. Household & Business Group 360 Audit Events (Phase 34)

The Household & Business Group 360 module tracks every access and administrative mutation to prevent unauthorized intelligence harvesting:

| Event Type | Trigger Condition | Logged Metadata |
|---|---|---|
| `GROUP_CREATED` | New relationship group (Household, Business Group) created | `groupId`, `groupType`, `name`, `actorId` |
| `GROUP_VIEWED` | Officer inspects group workspace | `groupId`, `actorId`, `requestId` |
| `GROUP_MEMBER_VIEWED` | Officer inspects group members list | `groupId`, `memberCount`, `restrictedMembersMasked` |
| `GROUP_RELATIONSHIP_VIEWED`| Officer views relationship network connections | `groupId`, `edgeCount` |
| `GROUP_GRAPH_VIEWED` | Officer renders or explores the interactive group graph | `groupId`, `actorId` |
| `GROUP_EVIDENCE_VIEWED` | Officer verifies group provenance documents | `groupId`, `evidenceCount` |
| `GROUP_OWNER_CHANGED` | Primary relationship manager handoff executed | `groupId`, `previousOwnerId`, `newOwnerId`, `reason` |
| `GROUP_PROFILE_VIEWED` | Officer loads multidimensional group intelligence profile | `groupId`, `actorId` |
| `GROUP_TIMELINE_VIEWED` | Officer accesses unified chronological group interaction timeline | `groupId`, `eventCount` |
| `GROUP_SCENARIO_CREATED` | Strategy simulator what-if scenario executed on group snapshot | `groupId`, `scenarioType` |
| `GROUP_AGENT_PLAN_CREATED` | Controlled Banking Agent drafts multi-entity recovery plan | `groupId`, `planId`, `stepCount` |

75: ---
76: 
77: ## 6. Trust & Governance Audit Events (Phase 35)
78: 
79: The Trust & Governance Center introduces comprehensive audit coverage for AI governance, approvals, data access, export tracking, and exceptions:
80: 
81: | Event Type | Trigger Condition | Logged Metadata |
82: |---|---|---|
83: | `GOVERNANCE_VIEWED` | User accesses `/governance` workspace tab | `tab`, `actorId`, `role` |
84: | `AI_COPILOT_SESSION_STARTED` | User starts or continues Copilot session | `sessionId`, `actorId`, `customerId` |
85: | `AGENT_PLAN_CREATED` | Autonomous Banking Agent drafts executable plan | `planId`, `customerId`, `objective`, `stepCount` |
86: | `AGENT_STEP_COMPLETED` | Execution engine completes an approved plan step | `planId`, `stepId`, `stepTitle`, `outcome` |
87: | `DATA_EXPORT_REQUESTED` | User initiates file or data export | `exportType`, `actorId`, `role`, `rowCount`, `filterScope` |
88: | `GOVERNANCE_EXCEPTION_ACKNOWLEDGED` | Staff acknowledges open governance exception | `exceptionId`, `actorId`, `previousStatus`, `newStatus` |
89: | `GOVERNANCE_EXCEPTION_ASSIGNED` | Exception assigned to designated owner/team | `exceptionId`, `actorId`, `assignedTo` |
90: | `GOVERNANCE_EXCEPTION_RESOLVED` | Exception marked resolved with justification | `exceptionId`, `actorId`, `resolutionNotes` |
91: | `GOVERNANCE_EXCEPTION_DISMISSED` | Exception dismissed with compliance reasoning | `exceptionId`, `actorId`, `dismissReason` |
92: | `AUTHORIZATION_FAILURE` | Denied request or IDOR breach attempt blocked | `path`, `actorId`, `role`, `reason`, `ipAddress` |
93: 
94: ---
95: 
96: ## 7. Cryptographic Tamper-Evident SHA-256 Audit Chaining
97: 
98: In Phase 35, all audit entries are cryptographically chained using SHA-256 hashing to guarantee tamper-evidence:
99: 
100: ```typescript
101: // Record hash computation
102: const payload = `${previousHash}|${userId}|${action}|${entityType}|${entityId}|${requestId}|${outcome}|${timestamp.toISOString()}`;
103: const recordHash = crypto.createHash('sha256').update(payload).digest('hex');
104: ```
105: 
106: - **Genesis Hash**: The first record in the audit chain links to `0000000000000000000000000000000000000000000000000000000000000000`.
107: - **Chain Verification**: The Audit Explorer service provides `verifyChainIntegrity(limit)` which recomputes SHA-256 hashes sequentially across records. Any unauthorized database tampering, row deletion, or payload modification is immediately flagged with `chainValid: false` and the specific broken index.
108: 
109: ---
110: 
111: ## 8. Audit Record Schema
112: 
113: Audit logs are stored in the PostgreSQL `audit_logs` table with the following attributes:
114: 
115: - `id`: Auto-incrementing unique sequence identifier.
116: - `user_id`: Authenticated banking staff ID (or `SYSTEM` for automated engine events).
117: - `user_role`: System role (`ADMIN`, `MAKER`, `CHECKER`, `OFFICER`, `AUDITOR`, `COMPLIANCE_OFFICER`).
118: - `action`: Standardized event string (e.g., `AGENT_STEP_COMPLETED`, `DATA_EXPORT_REQUESTED`).
119: - `entity_type`: Target domain entity (`DECISION_TRACE`, `AGENT_PLAN`, `GOVERNANCE_EXCEPTION`, `CUSTOMER`, `ACCOUNT`).
120: - `entity_id`: Primary identifier or unique business code.
121: - `details`: Structured JSON snapshot of event payload, state changes, or reason codes.
122: - `ip_address`: Originating client IP.
123: - `user_agent`: Originating browser or internal service agent string.
124: - `previous_hash`: SHA-256 hash of the immediately preceding audit record.
125: - `record_hash`: SHA-256 hash of the current record payload.
126: - `timestamp`: UTC timestamp with microsecond precision.
127: 
128: ---
129: 
130: ## 9. Immutability & Data Retention Policy
131: 
132: 1. **No Mutations or Deletions**: Audit logs have no `UPDATE` or `DELETE` endpoints. Database-level permissions prohibit table modifications by application roles.
133: 2. **PII Masking**: Sensitive identity values (e.g., full PAN, raw Aadhaar, private contact details) are masked or omitted in audit payloads.
134: 3. **Export Governance**: File and data exports are tracked with actor, role, dataset, and filter scope, without persisting raw customer records in audit logs.
135: 4. **Retention Policies**:
136:    - **Operational Audit Logs**: Retained in primary storage for a configurable period (recommended 7 years for enterprise banking compliance).
137:    - **Security & Authorization Logs**: Retained for a minimum of 3 years for forensic review.
138:    - **Governance Exceptions**: Retained indefinitely with full resolution and review history.
139:    - *Note: Legal and regulatory retention rules require institution-specific legal sign-off; COREvia does not claim generic automatic legal certification.*

