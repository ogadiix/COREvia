# COREvia Banking Platform — Phase 28: Relationship Graph & Network Intelligence

## 1. Executive Summary & Architecture Overview
Phase 28 introduces a production-grade, governed **Relationship Graph & Network Intelligence** layer over COREvia's PostgreSQL/Drizzle relational architecture. It enables Relationship Managers, Credit Officers, and Branch Leadership to visually navigate, analyze, and audit complex banking networks without unconstrained queries or opaque visualizations.

```
                      [ Client Applications ]
               (Desktop / Tablet / Institutional View)
                                 │
                                 ▼
                     [ Express API Gateway ]
               GET /api/relationship-graph/:type/:id
               GET /api/relationship-graph/path/:sT/:sI/:tT/:tI
               GET /api/relationship-graph/neighbors/:type/:id
               GET /api/relationship-graph/evidence/:edgeId
               GET /api/relationship-graph/analytics
                                 │
                                 ▼
                 [ Server-side RBAC & IDOR Guard ]
                 (resourceAuth.authorizeCustomer)
                                 │
                                 ▼
                  [ Relationship Graph Service ]
                 - Root Entity Resolution
                 - Bounded Traversal (Depth 1-3)
                 - Provenance & Evidence Extraction
                 - Shortest Path Discovery (Dijkstra)
                 - Network Degree & Distribution Analytics
                 - "What Changed" Context Extraction
                                 │
                                 ▼
                 [ PostgreSQL Relational Engine ]
          - Core Banking Tables (Accounts, Loans, Products, etc.)
          - Governed `relationship_edges` Table
          - Indexed Traversal & Regulatory Audit Trail
```

## 2. Graph Domain Model

### Supported Node Types
| Entity Type | Description | Source Primary Entity |
|---|---|---|
| `CUSTOMER` | Primary banking customer (individual / corporate) | `customers` table |
| `HOUSEHOLD` | Retail family group / household affiliation | `relationship_edges` |
| `BUSINESS` | Commercial entity affiliation / group holding | `relationship_edges` |
| `ACCOUNT` | CASA deposit accounts and ledgers | `accounts`, `account_balances` |
| `LOAN` | Credit facility / term loan / working capital | `loans` table |
| `PRODUCT` | Enrolled banking products & services | `customer_products`, `products` |
| `OPPORTUNITY` | CRM pipeline deal / expansion opportunity | `opportunities` table |
| `SERVICE_CASE` | Customer service ticket / escalation | `service_cases` table |
| `INTERACTION` | Officer interaction / communication log | `interactions` table |
| `RELATIONSHIP_REVIEW` | Periodic institutional relationship review | `interactions` / `relationship_reviews` |
| `ONBOARDING_APPLICATION` | Digital onboarding / KYC journey | `onboarding_applications` |
| `DOCUMENT` | Compliance document requirement / verified dossier | `documents` table |
| `TASK` | Operational action item / follow-up | `tasks` table |
| `COMMITMENT` | Formally logged customer / RM obligation | `interaction_commitments` table |
| `SIGNAL` | Real-time intelligence signal event | `relationship_signal_events` |
| `RELATIONSHIP_STATE` | Relationship Twin snapshot / CORE score | `relationship_snapshots` |

### Governed Relationship Types & Provenance
Every relationship edge is fully explainable with verifiable banking provenance:
- `DIRECT_RECORD`: Direct record linkage (e.g. Account ownership, Loan sanction).
- `DERIVED_FROM_ACCOUNT_OWNERSHIP`: Account-to-Product or joint holder linkage.
- `DERIVED_FROM_CASE`: Case-to-Interaction or Case-to-Task linkage.
- `DERIVED_FROM_INTERACTION`: Interaction commitments and resulting follow-up tasks.
- `DERIVED_FROM_OPPORTUNITY`: Opportunity-to-Product pipeline link.
- `DERIVED_FROM_REVIEW`: Formal periodic review findings.
- `DERIVED_FROM_ONBOARDING`: KYC/KYB journey product enrollment.
- `DERIVED_FROM_DOCUMENT`: Compliance verification requirement.
- `DERIVED_FROM_SIGNAL`: Real-time signal triggered against customer or facility.
- `DERIVED_FROM_EXISTING_RELATIONSHIP_ENGINE`: Digital Twin snapshot & CORE score state.

## 3. Database Schema: `relationship_edges`
```sql
CREATE TABLE relationship_edges (
  id SERIAL PRIMARY KEY,
  source_entity_type TEXT NOT NULL,
  source_entity_id TEXT NOT NULL,
  target_entity_type TEXT NOT NULL,
  target_entity_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  provenance_type TEXT NOT NULL DEFAULT 'DIRECT_RECORD',
  provenance_id TEXT,
  explanation TEXT,
  evidence TEXT,
  confidence NUMERIC(3, 2) DEFAULT '1.00',
  visibility_scope TEXT NOT NULL DEFAULT 'BRANCH',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## 4. Security & RBAC Enforcement
- **Strict Server-Side Authorization**: Every graph query validates user permissions through `resourceAuth.authorizeCustomer()`. Unauthorized access returns `403 FORBIDDEN_SCOPE` or `404 NOT_FOUND` without leaking entity existence or graph topology.
- **IDOR Protection**: Verified in automated tests. An RM assigned to a different branch cannot access or traverse restricted customer graphs.
- **Bounded Traversal Protection**: Requesting `depth > 3` is automatically clamped to 3. Maximum nodes hard-capped at 120 and edges hard-capped at 200 to prevent denial-of-service via graph traversal.

## 5. Copilot AI Integration
Copilot operates exclusively through 4 authorized tools:
1. `getRelationshipGraph(entityType, entityId, depth)`: Resolves normalized graph DTO.
2. `getRelationshipNeighbors(entityType, entityId)`: Immediate degree-1 connections.
3. `getRelationshipPath(sourceType, sourceId, targetType, targetId)`: Explains connection pathway.
4. `getRelationshipEvidence(edgeId)`: Detailed provenance and regulatory audit evidence.
All responses mandate explicit source citations and verifiable audit logging.
