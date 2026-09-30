# COREvia — Product Requirements Document (PRD)

## Executive Summary
COREvia is an institutional core banking and relationship intelligence platform engineered for commercial and retail banking institutions operating within Indian regulatory standards. It bridges transaction processing, compliance, maker-checker governance, and multi-tier relationship intelligence without creating disconnected data silos.

---

## 1. Phase 34: Household & Business Group 360

### 1.1 Objective
Build a governed group relationship intelligence workspace answering:
> "How is this relationship group connected to COREvia, what is the group's overall relationship profile, and how do individual relationships contribute to it?"

### 1.2 Target Entities & Group Types
1. **`HOUSEHOLD`**: Families, co-borrowers, dependents, and linked family enterprises (e.g. `HH-10482`: Sharma Family Household).
2. **`BUSINESS` / `BUSINESS_GROUP`**: Conglomerates, operating companies, holding entities, and key person affiliations (e.g. `BIZ-10482`: Sharma Bio-Agro Tech Pvt Ltd).

### 1.3 Key Functional Requirements
- **Group Portfolio Overview (`/groups`)**: Portfolio KPIs (Total Groups, Households, Business Groups, Portfolio Relationship Value, Average Members per Group), filterable by group type, status, RM owner, and search queries.
- **Unified Group 360 Workspace (`/group/:id`)**:
  - **Group Header**: Type, status badge, primary RM, primary customer / business link, and total relationship value.
  - **Multidimensional Relationship Health**: Group Value, CORE Profile distribution, product depth, service desk SLA health, opportunity pipeline, and active lifecycle journeys.
  - **Member Governance & Privacy**: Strict per-member resource authorization masking unauthorized members as `"Protected Member (Restricted Access)"` and excluding their financials.
  - **Visual Relationship Map**: Interactive hierarchical tree visualizer with accessible table fallback.
  - **Connected Accounts & Products**: Aggregated and deduplicated accounts, loans, and wealth products.
  - **Service & Escalation Health**: Aggregated open, critical, at-risk, and breached cases.
  - **Commercial Opportunities**: Pipeline coverage categorized by member and enterprise.
  - **Unified Timeline**: Unified chronological activity stream preserving entity attribution.
  - **Relationship Evidence**: Direct linkage to Phase 28 `relationship_edges` and provenance records.

### 1.4 Critical Non-Functional & Security Requirements
- **Mandatory Dual-Level Authorization Invariant**: Group access never implies access to member details. Officers without assignment to a member receive masked details and excluded financial totals.
- **No Single Fake "Group CORE Score"**: CORE Score is an individual metric. Group profile presents distribution and averages.
- **No Fake Financial Aggregation**: Relationship values are strictly computed from valid, authorized records or reported as `Unavailable`.
- **Zero Autonomous Financial Mutations**: High-impact actions require human-in-the-loop review and confirmation.
