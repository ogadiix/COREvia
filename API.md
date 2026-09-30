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


