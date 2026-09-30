# Changelog

## [Phase 34] - Household & Business Group 360
- **Governed Group Relationship Intelligence Layer**: Unified enterprise workspace and API suite answering how relationship groups connect to COREvia, tracking multidimensional group relationship profiles and individual member contributions across `HOUSEHOLD`, `BUSINESS`, and `BUSINESS_GROUP`.
- **Relational Domain Schema**: Added Section 29 PostgreSQL tables (`relationship_groups`, `relationship_group_members`) with foreign keys, cascading deletions, and indexes on `group_id`, `relationship_manager_id`, `status`, `entity_type`, and `entity_id`.
- **Strict Dual Authorization & Member-Level Privacy Filtering Invariant**: Enforced mandatory invariant that access to a group NEVER grants unrestricted access to nested members. When an RM is unassigned to a member, that member's protected fields are masked as `"Protected Member (Restricted Access)"`, financial values and scores are nulled, and financial sums strictly exclude their records.
- **Multidimensional Group Profile**: Aggregates group relationship value (strictly based on authorized records without fake estimation), CORE profile distributions and averages (avoiding fabricated single "group scores"), deduplicated product depth (avoiding double-counting shared products), service desk SLA health, opportunity coverage, and active lifecycle journeys.
- **Unified Chronological Timeline & Evidence Lineage**: Aggregates interactions across authorized group entities while preserving original entity attribution, interaction type, timestamp, owner, and source. Direct linkage to Phase 28 relationship graph edges and provenance documents.
- **Controlled Banking Agent & Governed Action Plans**: Added `proposeGroupRecovery` in agent planning service, drafting multi-entity action plans (service case remediation, household relationship review, business opportunity follow-up, and RM notification) awaiting human approval (`AWAITING_APPROVAL`).
- **Copilot Integration (10 Tools)**: Registered `getRelationshipGroups`, `getRelationshipGroup`, `getGroupMembers`, `getGroupProfile`, `getGroupTimeline`, `getGroupSignals`, `getGroupJourneys`, `getGroupOpportunities`, `getGroupServiceCases`, `getGroupEvidence` with dual authorization guards and fact/evidence/interpretation classification.
- **Institutional Clarity UI**: Created `GroupWorkspace`, `PortfolioGroupsView`, `GroupsModule`, unified navigation `/groups` and `/group/:id`, visual relationship map with accessible table fallback, and Category 5 global search integration.
- **Comprehensive Automated Verification**: Implemented 30 automated integration, multi-dimensional aggregation, member-level RBAC, and governance tests in Suite 9; all 178 platform tests pass 100% in 1.72s.

## [Phase 33] - Customer Journey Orchestrator & Lifecycle Management
- **Governed Multi-Step State Machine**: Implemented an institutional customer journey framework supporting 10 canonical lifecycle templates (`NEW_CUSTOMER_ONBOARDING`, `KYC_COMPLETION`, `LOAN_APPLICATION`, `SERVICE_RECOVERY`, `PRODUCT_ADOPTION`, `RELATIONSHIP_REVIEW`, `OPPORTUNITY_CONVERSION`, `DOCUMENT_COMPLETION`, `CUSTOMER_RETENTION_WORKFLOW`, `RELATIONSHIP_RECOVERY`).
- **Relational Domain Model**: Added Section 28 PostgreSQL tables (`journey_templates`, `journey_template_steps`, `customer_journeys`, `customer_journey_steps`, `journey_outcomes`) with foreign keys, relations, and indices.
- **Prerequisite Dependencies & Cascading Transitions**: Step progression requires prerequisite completion; completing a step cascades dependent steps from `PENDING` to `READY`. Terminal outcomes freeze journeys.
- **Authoritative Evidence Verification**: Verified step completion against live database records (`documents`, `tasks`, `serviceCases`, `opportunities`, `interactions`, `customerOpportunityRadar`) with zero fabricated verification.
- **SLA Deadline Tracking & Handoffs**: Automated SLA status calculation (`ON_TRACK`, `AT_RISK`, `BREACHED`, `COMPLETED`), role/user handoffs with audit trails, and controlled escalations linked to Decision Trace (`DT-...`).
- **Portfolio Analytics & Bottleneck Detection**: Aggregated portfolio-level SLA compliance, active count, average duration, and top blocking step bottlenecks with RBAC branch/RM scoping.
- **Copilot & Controlled Agent Tools**: Registered 7 Copilot tools (`getCustomerJourneys`, `getJourney`, `getJourneyTimeline`, `getJourneySteps`, `getJourneyBlockers`, `getJourneyEvidence`, `getJourneyHistory`) and `proposeJourneyRecovery` in Controlled Banking Agent generating governed plans requiring human approval.
- **Institutional UI**: Created `CustomerJourneyWorkspace`, `PortfolioJourneysView`, `CustomerJourneysTab` in Customer 360, and Global Search indexing.
- **Automated Verification**: Added 33 automated test scenarios; all 148 automated tests across 8 suites pass 100%.

## [Phase 32] - Relationship Value Intelligence & Portfolio Scenarios
- **Multidimensional Value Modeling**: Comprehensive institutional value assessment without synthetic monetary precision.
- **Trajectory Analysis & Explanations**: Historical trajectory tracking, dimension contribution explanations, and non-destructive scenario delta simulations.
- **Portfolio Health & Governance**: Scoped aggregation across branches and segments with zero production mutation.
- **Automated Verification**: 22 automated integration tests verified.

## [Phase 31] - Controlled Banking Agent & Governed Execution
- **Strict Human-in-the-Loop Boundaries**: Read-only autonomous context gathering coupled with strictly gated two-step execution (Propose Plan -> Human Approval -> Execute Plan).
- **Safety Allowlist & Context Resolvers**: Hard allowlist of approved actions and strict customer IDOR isolation preventing cross-customer access.
- **Automated Verification**: 15 automated integration tests verified.

## [Phase 30] - Relationship Strategy Simulator & What-If Sandbox
- **Safe & Non-Destructive What-If Simulation**: Implemented an institutional workspace allowing authorized bankers to test counterfactual relationship interventions without mutating production customer or account data.
- **Relational Scenario Schema**: Added `relationship_scenarios` and `relationship_scenario_actions` tables to PostgreSQL via Drizzle ORM with foreign keys, cascading deletions, and indexes on `scenario_id`, `customer_id`, and `created_by`.
- **Supported Banking Actions**: Supports 9 deterministic action types (`SCHEDULE_RELATIONSHIP_REVIEW`, `RESOLVE_SERVICE_CASE`, `FOLLOW_UP_OPPORTUNITY`, `COMPLETE_TASK`, `COMPLETE_COMMITMENT`, `LOG_RELATIONSHIP_INTERACTION`, `INCREASE_ENGAGEMENT_ACTIVITY`, `ACTIVATE_EXISTING_PRODUCT_OPPORTUNITY`, `UPDATE_RELATIONSHIP_REVIEW_STATUS`).
- **Sequential Multi-Action Step Ladder**: Multi-action scenarios evaluate strictly by `orderIndex`, generating intermediate relationship state snapshots and explainable step deltas.
- **Before / After Comparison Grid**: Full comparative metrics across CORE Score, Relationship Momentum, Service Health, Engagement Score, Product Depth, and Relationship Value with advantage highlighting.
- **Governed Production Action Bridge**: Simulated actions can be applied to real Core Banking execution (CRM tasks, case updates) through existing transactional pipelines with mandatory human confirmation notes and audit trail.
- **Decision Trace Binding & Staleness Detection**: Simulations automatically log `STRATEGY_SIMULATION` Decision Traces with explicit why factors, limitations, and source rules. Automatically flags saved scenarios as stale if underlying customer records change.
- **Side-by-Side Scenario Comparison**: Compares two scenarios for the same customer with metric advantage indicators (`BASE`, `TARGET`, `EQUAL`, `NOT_APPLICABLE`).
- **Copilot Integration**: Registered 5 dedicated Copilot tools (`createStrategyScenario`, `simulateStrategyScenario`, `getStrategyScenario`, `compareStrategyScenario`, `getScenarioTrace`) with Rule 10 enforcing simulation boundaries and no speculative lending/approval predictions.
- **Institutional Clarity UI**: Created `StrategySimulatorModule`, `ScenarioComparisonModal`, and `ApplyActionConfirmationModal` with sticky non-production warning badges and contextual navigation from Customer 360, Relationship Twin, Next Best Action, Opportunity Radar, Signal Center, and Decision Trace.
- **Audit Logging & IDOR Enforcement**: Full audit trail for `STRATEGY_SCENARIO_CREATED`, `STRATEGY_SCENARIO_SIMULATED`, `STRATEGY_SCENARIO_VIEWED`, `STRATEGY_SCENARIO_SAVED`, `STRATEGY_SCENARIO_ARCHIVED`, `STRATEGY_SCENARIO_COMPARED`, `STRATEGY_SIMULATION_ACTION_APPLIED`.
- **Automated Verification**: Added 21 automated integration tests (including the critical verification that live customer DB state is 100% untouched) bringing total test suite to 78 passing tests.

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
