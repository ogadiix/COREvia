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

## 4. Audit Record Schema

Audit logs are stored in the PostgreSQL `audit_logs` table with the following attributes:

- `id`: Auto-incrementing unique sequence identifier.
- `user_id`: Authenticated banking staff ID (or `SYSTEM` for automated engine events).
- `user_role`: System role (`ADMIN`, `MAKER`, `CHECKER`, `OFFICER`, `AUDITOR`).
- `action`: Standardized event string (e.g., `DECISION_TRACE_ACTION_CONFIRMED`).
- `entity_type`: Target domain entity (`DECISION_TRACE`, `CUSTOMER`, `ACCOUNT`, `TRANSACTION`).
- `entity_id`: Primary identifier or unique business code (e.g., `DT-20260928-00101`).
- `details`: Structured JSON snapshot of event payload, state changes, or reason codes.
- `ip_address`: Originating client IP.
- `user_agent`: Originating browser or internal service agent string.
- `timestamp`: UTC timestamp with microsecond precision.

---

## 5. Immutability & Retention Policy

1. **No Mutations or Deletions**: Audit logs have no `UPDATE` or `DELETE` endpoints. Database-level permissions prohibit table modifications by application roles.
2. **PII Masking**: Sensitive identity values (e.g., full PAN, raw Aadhaar, private contact details) are masked or omitted in audit payloads.
3. **Regulatory Inspection**: Auditors have read-only access to query audit event streams by date range, customer, actor, or event type.
