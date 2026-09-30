# COREvia AI & Decision Explainability Specification

## 1. AI Integration Architecture

COREvia uses **Google Gemini 3.8 Flash** strictly within a server-side orchestrated environment. The frontend React application never communicates directly with Google Gemini APIs or stores Google API keys.

```text
┌───────────────────────┐
│     Client Browser    │
│  (React 19 Frontend)  │
└───────────┬───────────┘
            │ POST /api/copilot/message (Authenticated session + CSRF)
            ▼
┌────────────────────────────────────────────────────────┐
│               Node.js Express Server                   │
│                                                        │
│  1. Session & RBAC Authentication                      │
│  2. Portfolio Scope & IDOR Verification                │
│  3. Input Sanitization & Prompt Injection Scrubbing    │
│  4. Gemini SDK Execution (Function Calling)            │
│  5. Copilot Tool Handlers (Deterministic DB Queries)   │
│  6. Audit Event Logging (`COPILOT_QUERY`, etc.)        │
└───────────┬────────────────────────────┬───────────────┘
            │ Function Calls             │ Direct Tool Execution
            ▼                            ▼
┌───────────────────────┐    ┌───────────────────────────┐
│  Google Gemini 3.8    │    │   PostgreSQL 16 DB        │
│  (Server-to-Server)   │    │   (58 Managed Tables)     │
└───────────────────────┘    └───────────────────────────┘
```

---

## 2. Decision Trace Copilot Tools

In Phase 29, the Copilot received direct explainability inspection tools:

| Tool Name | Parameters | Description | Security Controls |
|---|---|---|---|
| `getDecisionTrace` | `decisionId` (string) | Fetches complete decision trace rationale, engine version, confidence, and status | Validates customer ownership against user role |
| `getDecisionEvidence` | `decisionId` (string) | Retrieves structured evidence items categorized into primary and supporting | Logs `DECISION_TRACE_EVIDENCE_VIEWED` |
| `getDecisionSources` | `decisionId` (string) | Returns data lineage and source systems with freshness timestamps | Logs `DECISION_TRACE_SOURCES_VIEWED` |
| `getDecisionHistory` | `customerId` (number) | Retrieves chronological list of decision traces for a customer | Enforces portfolio scoping (`resourceAuth.authorizeCustomer`) |
| `createStrategyScenario` | `customerId`, `name`, `actions` | Creates a counterfactual relationship strategy scenario | Requires customer authorization |
| `simulateStrategyScenario` | `customerId` or `scenarioId`, `actions` | Runs deterministic multi-action simulation and step ladder | Labels output as SIMULATION ONLY |
| `getStrategyScenario` | `scenarioId` | Retrieves saved scenario with before/after comparisons and staleness check | Validates ownership |
| `compareStrategyScenario` | `baseScenarioId`, `targetScenarioId` | Compares two scenarios for the same customer side-by-side | Enforces same-customer boundary |
| `getScenarioTrace` | `scenarioId` | Retrieves explainability decision trace and why factors for simulation | Scoped to customer portfolio |
| `getCustomerJourneys` | `customerId` | Returns active and historical customer lifecycle journeys with progress | Scoped to customer portfolio |
| `getJourney` | `journeyId` | Returns comprehensive journey state, steps, blockers, and SLA status | RBAC IDOR authorized |
| `getJourneyTimeline` | `journeyId` | Chronological audit and event trail for a journey | Authoritative event extraction |
| `getJourneySteps` | `journeyId` | Ordered execution steps, prerequisites, dependencies, and verification status | Classifies step facts & ready actions |
| `getJourneyBlockers` | `customerId`, `journeyId` | Diagnoses current blockers and SLA breaches requiring operational intervention | Visibly classified as INTERPRETATION |
| `getJourneyEvidence` | `journeyId`, `stepId` | Authoritative completion evidence verified against core database entities | Visibly classified as EVIDENCE |
| `getJourneyHistory` | `customerId`, `limit` | Historical completed/cancelled journeys for lifecycle trajectory analysis | FACT classification |

---

## 3. Explainability & Grounding Rules

The Copilot is governed by strict system instructions (`COPILOT_SYSTEM_INSTRUCTION`):

### Rule 8: Explainability & Grounding
When explaining recommendations, risk alerts, CORE scores, or prioritization:
1. Explain the **primary rationale** and distinguish it from secondary background context.
2. List the **specific evidence items** that contributed, indicating whether each had positive, negative, or neutral impact.
3. Identify the **source engine** and **model/rules version**.
4. State whether the recommendation is **confirmed, pending review, or executed**.
5. Explicitly state **limitations or missing data** (e.g., "GST returns unavailable", "Recent bureau pull is pending").

### Rule 9: Visible Evidence Classification
When an explanation is requested, the Copilot must visibly classify statements using standardized tags:
- `[FACT]`: Raw data verified in the core database (e.g., "Current CASA balance is ₹14,20,000").
- `[EVIDENCE]`: Observed patterns or signals (e.g., "Average monthly inward remittances grew by 34% over Q2").
- `[INTERPRETATION]`: Analytical reasoning linking evidence to conclusions (e.g., "Indicates surplus operational liquidity suitable for short-term sweep").
- `[RECOMMENDATION]`: Proposed banking action (e.g., "Propose 91-day auto-sweep fixed deposit").
- `[LIMITATION]`: Missing parameters or confidence boundaries (e.g., "Customer external tax filing not refreshed since FY25").

### Rule 10: Relationship Strategy Simulation & What-If Boundaries (Phase 30)
When simulating counterfactual relationship strategies or what-if interventions:
1. Always label outputs clearly as **SIMULATION — NOT PRODUCTION DATA**.
2. **Never assert that customer data has been changed or updated** during a simulation. Live database state is 100% immutable during simulation.
3. **Never predict loan approvals, credit underwriting decisions, churn guarantees, or customer conversions**. Simulations illustrate rule-based indicator deltas only.
4. State explicit **assumptions and limitations** for every simulated action.
5. Emphasize that actual banking execution requires human confirmation and authorization via production Core Banking workflows.

### Rule 11: Customer Journey Governance & Verification Boundaries (Phase 33)
When evaluating or explaining customer lifecycle journeys:
1. **Never fabricate journey progress or claim a step is complete without authoritative evidence** verified against core records (`documents`, `tasks`, `cases`, `opportunities`).
2. Clearly distinguish between `READY` steps (dependencies satisfied) and `PENDING` steps (waiting for prerequisites).
3. If a step or journey is `BLOCKED`, cite the exact blocker reason and required resolver role.
4. Autonomous agent remediation proposals must generate draft plans requiring human approval (`AWAITING_APPROVAL`) before execution.

---

## 4. Hallucination Prevention & Synthetic Data Safeguards

1. **No Direct DB Access for Gemini**: Gemini does NOT execute SQL or inspect raw database connections. It only interacts via bounded, strongly typed tool functions.
2. **Deterministic Fallbacks**: If Gemini is offline, throttled, or returns an error, COREvia gracefully falls back to deterministic decision inspection panels.
3. **No Fabricated Confidence**: The system forbids inventing confidence metrics when engines do not provide them.
4. **Synthetic Data Sandbox**: All accounts, PANs, Aadhaar numbers, and company names are synthetic representations adhering to regulatory structures.

