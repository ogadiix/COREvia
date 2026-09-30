# COREvia Architecture & Decision Explainability Platform

## 1. System Overview

COREvia is an institutional core banking and relationship intelligence platform engineered with a strict tiered architecture:
- **Presentation Tier**: React 19 SPA with TypeScript, Tailwind CSS, Lucide icons, and responsive layouts (supporting viewports 375px through 1440px+).
- **Application & API Tier**: Node.js & Express.js 4 backend with enterprise middleware for RBAC, session management, CSRF validation, rate limiting, and request correlation.
- **Data Tier**: PostgreSQL 16 managed via Drizzle ORM (58 relational tables), enforcing relational integrity, cascading rules, and check constraints.
- **Intelligence & Explainability Tier**: Dual-mode engine architecture combining deterministic banking logic with governed Gemini 3.8 Flash Copilot capabilities and transparent decision trace lineages.

---

## 2. Decision Trace & Explainability Architecture (Phase 29)

The Decision Trace & Explainability layer answers the fundamental banking auditability question:
> **"Why did COREvia recommend, flag, prioritize, or summarize this?"**

### 2.1 Core Architectural Principles
1. **Governed Explainability**: Decisions are captured as first-class relational entities (`decision_traces`), not fleeting transient prompts.
2. **Deterministic & Model-Driven Lineage**: Both rule-based engines (CORE Score calculation, SLA monitors) and model-assisted engines (Opportunity Radar, NBA, Copilot) emit immutable traces.
3. **Evidence Lineage Topology**: Each trace links to explicit, structured evidence items with primary vs. supporting classification, quantitative weights, and contribution direction (positive, negative, neutral).
4. **Source Chain Transparency**: Traces reference the upstream systems, database tables, models, and exact versions that produced the underlying signals.
5. **Human-in-the-Loop Governance**: Recommended actions require explicit confirmation, reasoned rejection, or tracked execution by authorized banking personnel.
6. **Zero Information Leakage**: Strong RBAC and portfolio-scoped IDOR enforcement isolate customer traces.

---

## 3. Domain Model & Entity-Relationship Schema

```
┌─────────────────────────────────────────────────────────────┐
│                       CUSTOMERS                             │
└──────────────────────────────┬──────────────────────────────┘
                               │ 1:N
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    DECISION_TRACES                          │
│ ─────────────────────────────────────────────────────────── │
│ - id: serial primary key                                    │
│ - decision_id: text unique (e.g. DT-20260928-00101)         │
│ - customer_id: integer foreign key -> customers(id)         │
│ - source_engine: text (CORE_SCORE, NBA, RADAR, etc.)        │
│ - decision_type: text (RECOMMENDATION, RISK_FLAG, etc.)     │
│ - decision_mode: text (DETERMINISTIC, MODEL_ASSISTED, etc.) │
│ - model_version: text                                       │
│ - title / summary / primary_rationale: text                 │
│ - confidence: text (or null if rule-based)                  │
│ - status: text (PENDING_REVIEW, CONFIRMED, etc.)            │
│ - action_taken / review notes / executed_at: timestamps     │
│ - created_at: timestamp with time zone                      │
└──────────────┬──────────────────────────────┬───────────────┘
               │ 1:N                          │ 1:N
               ▼                              ▼
┌─────────────────────────────┐┌──────────────────────────────┐
│   DECISION_TRACE_EVIDENCE   ││  DECISION_TRACE_SOURCE_NODES │
│ ─────────────────────────── ││ ──────────────────────────── │
│ - trace_id: foreign key     ││ - trace_id: foreign key      │
│ - evidence_type: text       ││ - node_id: text              │
│ - title / description: text ││ - node_type: text (DB, etc.) │
│ - weight / impact: text     ││ - node_label: text           │
│ - contribution_type: text   ││ - freshness_timestamp: time  │
│ - is_primary: boolean       ││ - entity_reference: text     │
└─────────────────────────────┘└──────────────────────────────┘
```

---

## 4. Freshness & Confidence Semantics

- **Real Freshness**: Freshness is calculated by comparing node `freshness_timestamp` against the current server time (e.g., "5 min ago", "2 hours ago"). If no timestamp exists, the platform explicitly displays `"Freshness unavailable"`. It never fabricates `"real-time"`.
- **Confidence Semantics**: If an engine does not emit a mathematical confidence metric, the trace explicitly specifies:
  - `Confidence: Not provided by source engine`
  - `Decision basis: Rule-based`
  Confidence is never hallucinated or filled with generic 100% or 0% defaults.

---

## 5. Human Governance Lifecycle

```text
                  ┌────────────────────┐
                  │   PENDING_REVIEW   │
                  └─────────┬──────────┘
                            │
           ┌────────────────┴────────────────┐
           ▼                                 ▼
   ┌───────────────┐                 ┌──────────────┐
   │   CONFIRMED   │                 │   REJECTED   │
   └───────┬───────┘                 │ (mandatory   │
           │                         │  reason)     │
           ▼                         └──────────────┘
   ┌───────────────┐
   │   EXECUTED    │
   │ (transaction/ │
   │  ticket ref)  │
   └───────────────┘
```

Every state transition records the operator identity, role, timestamp, justification note, and generates an immutable security audit event.

---

## 6. Comparative Trace Analysis

The platform allows authorized officers to compare two traces for the same customer:
- **Same-Customer Constraint**: Comparative analysis strictly rejects cross-customer trace pairs (`400 Bad Request: Cross-customer trace comparison forbidden`) to prevent relationship data leakage.
- **Delta Computation**: Automatically computes:
  - Common evidence items
  - Unique / added evidence items
  - Deprecated / removed evidence items
  - Confidence shift
  - Status progression

---

## 7. Relationship Strategy Simulator & What-If Sandbox (Phase 30)

### 7.1 Non-Destructive Simulation Architecture
The Strategy Simulator provides an enterprise-grade sandbox allowing authorized Relationship Managers and Branch Managers to evaluate counterfactual scenarios:
- **Zero Production Mutation**: In-memory cloning of baseline customer entity state (snapshot captured via `getBaseSnapshot`). No mutations occur to live `customers`, `accounts`, `loans`, `service_cases`, `opportunities`, or `tasks` tables during simulation.
- **Deterministic Action Pipeline**: Evaluates up to 9 supported banking actions sequentially by `orderIndex`:
  1. `SCHEDULE_RELATIONSHIP_REVIEW`: +2 CORE Score, sets momentum to accelerating, reduces days since interaction, adds follow-up task.
  2. `RESOLVE_SERVICE_CASE`: Resolves simulated service case, improves Service Health to EXCELLENT/GOOD, +3 CORE Score.
  3. `FOLLOW_UP_OPPORTUNITY`: Progresses stalled commercial opportunities, adds +1 CORE Score.
  4. `COMPLETE_TASK`: Clears operational backlog, resets overdue tasks.
  5. `COMPLETE_COMMITMENT`: Fulfills promises to clients, +1 CORE Score.
  6. `LOG_RELATIONSHIP_INTERACTION`: Resets days since interaction to 0, +5 engagement points.
  7. `INCREASE_ENGAGEMENT_ACTIVITY`: Boosts engagement score (+8), transitions relationship state to ENGAGED.
  8. `ACTIVATE_EXISTING_PRODUCT_OPPORTUNITY`: Deepens product depth (+1), +2 CORE Score.
  9. `UPDATE_RELATIONSHIP_REVIEW_STATUS`: Transitions review status to COMPLETED, +1 CORE Score.

### 7.2 Governed Action Application Bridge
When a banker decides to execute a simulated strategy, the action transitions across a governed human confirmation bridge:
1. Banker selects simulated action item and provides mandatory confirmation justification notes.
2. System verifies user RBAC permissions and portfolio-scoped customer ownership.
3. System routes execution into real transactional Core Banking pipelines (e.g. creating real `tasks` or updating `service_cases`).
4. Generates immutable audit event `STRATEGY_SIMULATION_ACTION_APPLIED` referencing both the simulation scenario and the resulting real entity ID.

### 7.3 Decision Trace & Staleness Engine
### 7.3 Decision Trace & Staleness Engine
- **Decision Trace Binding**: Every simulation automatically logs a `STRATEGY_SIMULATION` Decision Trace capturing why factors, constraints, limitations, and simulated evidence deltas.
- **Staleness Detection**: Saved scenarios track `baseSnapshot.asOf`. When a banker views a saved scenario, the engine checks if `customer.updatedAt > scenario.baseSnapshot.asOf`. If true, the scenario is explicitly labeled stale with a prominent amber alert badge and an instant "Re-run with Current Data" action.

---

## 8. Controlled Banking Agent & Governed Execution (Phase 31)
- **Zero Autonomous Execution**: Two-step gated execution model where autonomous actions are strictly read-only, producing proposed plans (`AWAITING_APPROVAL`) requiring human approval before mutation.
- **Context Resolvers & Hard Action Allowlist**: Resolves entity context with boundary verification (`CUSTOMER`, `ACCOUNT`, `JOURNEY`, `GROUP`) ensuring strict IDOR defense.

---

## 9. Relationship Value Intelligence & Portfolio Scenarios (Phase 32)
- **Multidimensional Value Aggregation**: Deterministic calculation across deposits, advances, fee-based products, and engagement momentum.
- **Zero Hallucinated Values**: If an underlying entity's value is absent, it is explicitly reported as `Unavailable` rather than fabricated.

---

## 10. Customer Journey Orchestrator & Lifecycle Management (Phase 33)
- **Governed Multi-Step State Machine**: 10 canonical templates orchestrating customer onboarding, servicing, and retention.
- **Authoritative Database Evidence**: Completion claims are directly evaluated against authoritative database tables (`documents`, `tasks`, `serviceCases`, `opportunities`, `interactions`).

---

## 11. Household & Business Group 360 Architecture (Phase 34)

```text
               ┌────────────────────────────────────────────────────────┐
               │         RELATIONSHIP GROUPS (HH / BIZ)                 │
               │  - id: serial PK                                       │
               │  - group_id: text unique (HH-10482, BIZ-10482)         │
               │  - group_type: HOUSEHOLD | BUSINESS | BUSINESS_GROUP   │
               │  - primary_customer_id / primary_business_id           │
               │  - relationship_manager_id / secondary_rm_id           │
               └───────────────────────────┬────────────────────────────┘
                                           │ 1:N
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │              RELATIONSHIP GROUP MEMBERS                │
               │  - id: serial PK                                       │
               │  - group_id: integer FK -> relationship_groups(id)     │
               │  - entity_type: CUSTOMER | BUSINESS                    │
               │  - entity_id: text ID (numeric customer id or biz code)│
               │  - role / relationship_type / ownership_percentage     │
               └───────────────────────────┬────────────────────────────┘
                                           │ Dual-Level RBAC Gate
                                           ▼
      ┌──────────────────────────────────────────────────────────────────────────┐
      │         MEMBER RESOURCE AUTHORIZATION & PRIVACY FILTERING                │
      │                                                                          │
      │   RM assigned to Member A?  ──> YES: Full details, score, and value      │
      │   RM assigned to Member B?  ──> NO:  Masked: "Protected Member",         │
      │                                      Score & Value excluded from totals  │
      └────────────────────────────────────┬─────────────────────────────────────┘
                                           │
                                           ▼
      ┌──────────────────────────────────────────────────────────────────────────┐
      │                    MULTIDIMENSIONAL GROUP PROFILE                        │
      │  - Relationship Value: Sum of authorized member values (or Unavailable)  │
      │  - Group CORE Profile: Range, Average, Distribution (No fake score)      │
      │  - Deduplicated Product Depth: Unique product types across members       │
      │  - Group Service Health: Open, Critical, At Risk, Breached SLA cases     │
      │  - Group Opportunities: Pipeline by member and affiliated enterprise     │
      │  - Group Journeys: Phase 33 Active, Blocked, Completed journeys          │
      │  - Unified Timeline: Chronological interactions retaining provenance     │
      └──────────────────────────────────────────────────────────────────────────┘
```

### 11.1 Dual-Level Authorization Invariant (Crucial Security Defense)
1. **Group Authorization**: Confirms the requesting user is allowed to access the group metadata and know that the group exists.
2. **Member Resource Authorization**: Iterates through each nested entity. If the officer is not authorized for that specific customer:
   - Name is masked to `"Protected Member (Restricted Access)"`.
   - Customer code, CIF, PAN, and identity fields are omitted.
   - Financial value and CORE score are nulled.
   - Their financial figures are strictly excluded from group totals.
   - Cross-customer opportunities and service cases are filtered out.

### 11.2 No Fake Group Aggregation Invariant
- **No Single "Group CORE Score"**: CORE Score is strictly an individual customer engine. The group profile presents distributions (min, max, average, tier counts).
- **No Fabricated Financial Aggregation**: Group relationship value is computed strictly by summing valid, authorized records. If records are unpopulated or unauthorized, the group reports `Unavailable`.

### 11.3 AI & Engine Synergy
- **Relationship Graph (Phase 28)**: Traverses existing `relationship_edges` and presents provenance data without duplicating the graph engine.
- **Decision Trace (Phase 29)**: Traces group prioritization evidence linking member score shifts, stalled commercial opportunities, and open service tickets.
- **Strategy Simulator (Phase 30)**: Executes what-if counterfactual scenarios on authorized snapshots without mutating production databases.
- **Controlled Banking Agent (Phase 31)**: Generates multi-entity group recovery plans (`proposeGroupRecovery`) requiring explicit human authorization.
- **Copilot (10 Tools)**: Exposes classified tools (`getRelationshipGroups`, `getRelationshipGroup`, `getGroupMembers`, `getGroupProfile`, `getGroupTimeline`, `getGroupSignals`, `getGroupJourneys`, `getGroupOpportunities`, `getGroupServiceCases`, `getGroupEvidence`) adhering to dual authorization.


