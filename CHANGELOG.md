# Changelog

## [Phase 29] - AI Decision Trace & Explainability Platform
- **Governed Decision Trace Engine**: Enterprise-grade decision explanation layer answering *"Why did COREvia recommend, flag, prioritize, or summarize this?"* without duplicating existing intelligence engines.
- **Relational Domain Model**: Created `decision_traces`, `decision_trace_evidence`, and `decision_trace_source_nodes` tables in PostgreSQL via Drizzle ORM, with indexes on `decision_id`, `customer_id`, `source_engine`, `decision_type`, and `generated_at`.
- **Decision Modes & Honest Confidence**: Supported `DETERMINISTIC`, `AI_GENERATED`, `HYBRID`, and `SYSTEM_RULE`. Never fabricates confidence scores—deterministic rules explicitly return null confidence and state `"Rule-based"`.
- **Decision Evidence & Contribution Topology**: Granular evidence records capturing observed vs. previous values, change directions, qualitative contribution types (`PRIMARY`, `SUPPORTING`, `CONTEXT`, `CONSTRAINT`, `NEGATIVE_SIGNAL`), without mathematical percentage fabrication.
- **Source-Chain & Honest Freshness**: Complete source-chain tracking with exact timestamps. Real-time relative freshness calculation (`2 min ago`, etc.) or explicit `"Freshness unavailable"`. Never fabricates "real-time".
- **Human Banker Action Governance**: Governed lifecycle workflow: Decision → Evidence → Suggested Action → Human Confirmation → Authorization → Execution → Audit → Outcome.
- **Decision Comparison & History**: Side-by-side delta engine for analyzing added/removed evidence and metric shifts between decision snapshots with strict cross-customer isolation.
- **Copilot Integration & Classification**: Added `getDecisionTrace`, `getDecisionEvidence`, `getDecisionSources`, and `getDecisionHistory` controlled Copilot tools with server-side RBAC and strict separation of FACT, EVIDENCE, INTERPRETATION, RECOMMENDATION, and LIMITATION.
- **Institutional Clarity UI**: Created reusable slide-over `DecisionTracePanel` and `DecisionComparisonModal` responsive across 1440px to 375px mobile sheets, integrated across Customer 360 (`DECISIONS` tab & CORE Score card), Next Best Action, Opportunity Radar, Relationship Twin, and Signal Center.
- **Audit & IDOR Security**: Audited `DECISION_TRACE_CREATED`, `DECISION_TRACE_VIEWED`, `DECISION_TRACE_EVIDENCE_VIEWED`, `DECISION_TRACE_SOURCES_VIEWED`, `DECISION_TRACE_COMPARED`, `DECISION_TRACE_ACTION_CONFIRMED`, `DECISION_TRACE_ACTION_REJECTED`, `DECISION_TRACE_ACTION_EXECUTED`. Zero IDOR tolerance.
- **Automated Verification**: Added 20 automated integration and security tests to test suite (57 total platform tests passing).

## [Phase 28] - Relationship Graph & Network Intelligence
- **Governed Relationship Exploration Engine**: Implemented production-grade relationship graph over PostgreSQL/Drizzle connecting Customers, Households, Businesses, Accounts, Loans, Products, Opportunities, Service Cases, Interactions, Relationship Reviews, Onboarding, Documents, Tasks, Commitments, Signals, and Digital Twin state.
- **Relational Graph Schema & Provenance**: Added `relationship_edges` table with unique constraint and indexes for direct/derived relationship mapping, visibility scope, and full regulatory audit evidence/provenance (`DIRECT_RECORD`, `DERIVED_FROM_ACCOUNT_OWNERSHIP`, `DERIVED_FROM_INTERACTION`, `DERIVED_FROM_SIGNAL`, etc.).
- **Server-Side Security & RBAC Enforcement**: Enforced strict resource-level authorization via `resourceAuth.authorizeCustomer` to prevent horizontal/vertical privilege escalation and IDOR. Traversal depth strictly bounded (clamped to max depth 3, capped at 120 nodes / 200 edges).
- **Shortest Path & Network Analytics**: Added bounded breadth-first shortest-path traversal (BFS) and degree/entity distribution analytics.
- **Interactive Institutional Clarity UI**: Built canvas/SVG graph visualizer with zoom/pan, fit-to-view, deterministic layout, accessible list/table alternative, node & edge provenance drawers, and "What Changed" recent activity integration.
- **Cross-Platform Integration**: Integrated graph entry points and focused views into Customer 360 (`GRAPH` tab), Relationship Digital Twin ("Explore Relationship Graph"), and Global Search.
- **Copilot Graph Tools**: Registered `getRelationshipGraph`, `getRelationshipNeighbors`, `getRelationshipPath`, and `getRelationshipEvidence` with strict authorization guards and source citation reporting.
- **Audit Logging**: Comprehensive audit trail for `RELATIONSHIP_GRAPH_VIEWED`, `RELATIONSHIP_GRAPH_EXPANDED`, `RELATIONSHIP_GRAPH_PATH_VIEWED`, `RELATIONSHIP_GRAPH_FILTER_APPLIED`, and `RELATIONSHIP_GRAPH_COPILOT_USED`.

## [Phase 18] - Production Readiness & Operations
- Implemented robust environment validation at server startup.
- Configured graceful shutdown logic for HTTP server and connections.
- Secured database seeding script against accidental execution in production.
- Refined migration scripts (`db:migrate`, `db:generate`) in package configuration.
- Added extensive operational documentation (Deployment, Disaster Recovery, Operations Runbook).
- Enforced strict rate limiting on high-cost Gemini Copilot API routes.
- Sanitized `.env.example` to ensure no credential leakage.

## [Phase 17] - Security & Production Hardening
- Implemented comprehensive RBAC (Role-Based Access Control) across all API endpoints.
- Introduced CSRF protection and payload limits.
- Audited DTO object persistence with strict allowlist sanitization to prevent Mass Assignment.

## [Phase 1-16] - Core Platform Development
- Core Customer CRM, Accounts, Loans, and Service modules built.
- CORE Score analytics and financial health modeling.
- Next Best Action (NBA) and Opportunity Radar predictive pipelines.
- Intelligent notification delivery and rules engine.
- Gemini-powered Banking Copilot with contextual awareness.
