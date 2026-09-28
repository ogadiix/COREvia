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
