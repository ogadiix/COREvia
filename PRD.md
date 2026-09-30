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
34: - **No Fake Financial Aggregation**: Relationship values are strictly computed from valid, authorized records or reported as `Unavailable`.
35: - **Zero Autonomous Financial Mutations**: High-impact actions require human-in-the-loop review and confirmation.
36: 
37: ---
38: 
39: ## 2. Phase 35: Trust & Governance Center
40: 
41: ### 2.1 Objective
42: Establish a centralized enterprise governance workspace (`/governance`) answering:
43: > "WHO? WHAT? WHEN? WHY? WHICH DATA? WHICH ENGINE? WHICH TOOL? WHICH PERMISSION? WHICH APPROVAL? WHICH RESULT?"
44: For all meaningful actions, AI inferences, agent plans, and security events across COREvia.
45: 
46: ### 2.2 Core Modules & Workspaces
47: 1. **Governance Overview**: Enterprise health status (`OPERATIONAL`, `ATTENTION_REQUIRED`, `CRITICAL`), audit statistics, AI/Copilot sessions, agent plan outcomes, security alerts, and open exceptions.
48: 2. **Audit Explorer**: Searchable, filterable audit records with SHA-256 cryptographic tamper-evident chaining (`previousHash`, `recordHash`) and automated chain integrity verification.
49: 3. **AI Governance**: Visibility into AI Copilot sessions, tool invocations, safe Gemini configuration status, AI fallback tracking, and mandatory AI Source Classification (`DETERMINISTIC`, `AI_GENERATED`, `HYBRID`, `SYSTEM_RULE`).
50: 4. **Agent Governance**: Controlled Banking Agent plan lifecycle tracking (plans drafted, approved, rejected, completed, partially completed, failed, expired) with step-level audit trails.
51: 5. **Access & Security Governance**: Neutral monitoring of authorization denials, repeated failures, active sessions, expired tokens, and IDOR prevention events.
52: 6. **Data Governance & Lineage**: Visual data lineage tracking intelligence flow from raw customer records through CORE Score, Next Best Action, Decision Trace, Agent Plan, Action, to Audit.
53: 7. **Approval Center**: Unified Maker-Checker dual control across agent plans, journey escalations, group ownership transfers, and sensitive operations.
54: 8. **Export Activity Tracking**: Lightweight logging of file and report exports (`DATA_EXPORT_REQUESTED`) capturing actor, role, dataset, and filter scope.
55: 9. **System Health**: Genuine live PostgreSQL database latency ping, Gemini availability, authentication health, notifications, and search subsystem checks.
56: 10. **Governance Exceptions**: Managed exception workflow (`governance_exceptions` table) across categories (`SECURITY`, `AUTHORIZATION`, `AI`, `AGENT`, `DATA`, `AUDIT`, `CONFIGURATION`, `INTEGRATION`, `OPERATIONAL`) with assignment, acknowledgment, resolution, and dismissal.
57: 
58: ### 2.3 Non-Functional & Regulatory Invariants
59: - **Zero Secret Exposure**: Model API keys, passwords, and tokens are strictly masked (`CONFIGURED` / `MISSING`).
60: - **No Meaningless "Trust Scores"**: System condition is derived from real metrics, never an arbitrary score.
61: - **No False Certification Claims**: Strictly avoids claiming actual RBI, ISO, or SOC compliance unless technically verified by accredited auditors.
62: - **Controlled AI Agent Security Boundary**: AI agents remain strictly read-only within the Governance Center and cannot resolve exceptions or modify system configuration.

