# COREvia Database Schema Specification

## 1. Overview
COREvia utilizes PostgreSQL 16 managed via Drizzle ORM. The relational architecture enforces relational integrity, foreign key cascades, unique constraints, and optimized B-tree indexes for analytical and operational workloads.

---

## 2. Phase 34 Schema: Relationship Groups & Members

### 2.1 Table: `relationship_groups`
Represents governed household and corporate relationship clusters.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` | Internal database surrogate key |
| `group_id` | `TEXT` | `NOT NULL UNIQUE` | Textual identifier (`HH-10482`, `BIZ-10482`) |
| `group_type` | `TEXT` | `NOT NULL` | Group category (`HOUSEHOLD`, `BUSINESS`, `BUSINESS_GROUP`) |
| `name` | `TEXT` | `NOT NULL` | Legal / formal group name |
| `display_name` | `TEXT` | `NOT NULL` | Human-friendly display label |
| `description` | `TEXT` | `NULLABLE` | Relationship synopsis / notes |
| `status` | `TEXT` | `NOT NULL DEFAULT 'ACTIVE'` | `ACTIVE`, `INACTIVE`, `UNDER_REVIEW`, `ARCHIVED` |
| `primary_customer_id` | `INTEGER` | `REFERENCES customers(id) ON DELETE SET NULL` | Primary family member / representative |
| `primary_business_id` | `TEXT` | `NULLABLE` | Primary corporate entity identifier |
| `relationship_manager_id` | `INTEGER` | `REFERENCES users(id) ON DELETE SET NULL` | Primary assigned RM |
| `secondary_rm_id` | `INTEGER` | `REFERENCES users(id) ON DELETE SET NULL` | Secondary / backup RM |
| `metadata` | `JSONB` | `NULLABLE` | Address, tiering, operational tags |
| `created_at` | `TIMESTAMP` | `NOT NULL DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMP` | `NOT NULL DEFAULT NOW()` | Last update timestamp |

**Indexes**:
- `idx_groups_rm_id`: `relationship_manager_id`
- `idx_groups_status`: `status`

---

### 2.2 Table: `relationship_group_members`
Maps individual customers and corporate entities into relationship groups with explicit roles.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` | Member relationship surrogate key |
| `group_id` | `INTEGER` | `NOT NULL REFERENCES relationship_groups(id) ON DELETE CASCADE` | Parent relationship group reference |
| `entity_type` | `TEXT` | `NOT NULL` | `CUSTOMER` or `BUSINESS` |
| `entity_id` | `TEXT` | `NOT NULL` | Customer ID (numeric as string) or Business ID |
| `role` | `TEXT` | `NOT NULL` | Role label (`Head of Family`, `Managing Director`, `Spouse`) |
| `relationship_type` | `TEXT` | `NOT NULL` | Normalized type (`HOUSEHOLD_MEMBER`, `SPOUSE`, `DIRECTOR`, etc.) |
| `ownership_percentage` | `NUMERIC(5, 2)`| `NULLABLE` | Direct equity share (if applicable) |
| `is_primary` | `BOOLEAN` | `NOT NULL DEFAULT false` | Primary contact flag within group |
| `valid_from` | `DATE` | `NULLABLE` | Relationship start date |
| `valid_to` | `DATE` | `NULLABLE` | Relationship expiration / dissolution date |
| `metadata` | `JSONB` | `NULLABLE` | Customer code, relation tags, KYC verification notes |
| `created_at` | `TIMESTAMP` | `NOT NULL DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMP` | `NOT NULL DEFAULT NOW()` | Last update timestamp |

**Indexes**:
- `idx_group_members_group_id`: `group_id`
- `idx_group_members_entity`: `entity_type, entity_id`
- `idx_group_members_rel_type`: `relationship_type`

---

## 3. Related Platform Tables (Reused Without Duplication)
- `relationship_edges`: Phase 28 network graph edges and provenance records.
- `customers`: Individual and corporate customer master records.
- `accounts`: Current and savings accounts (CASA) and term deposits.
- `loans`: Retail lending and commercial credit facilities.
- `products` & `customer_products`: Core banking product catalog and customer holdings.
- `opportunities`: Commercial opportunity pipeline and radar signals.
- `service_cases`: Service desk dispute tickets and SLA monitoring.
- `customer_journeys`: Phase 33 orchestrated customer lifecycle journeys.
- `interactions`: Customer touchpoint history and interaction notes.

---

## 4. Phase 39 Schema: Enterprise Administration & Governance Center

### 4.1 Table: `feature_flags`
Stores governed feature flags across deployment environments without allowing security control bypass.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` | Primary key identifier |
| `flag_key` | `TEXT` | `NOT NULL UNIQUE` | Unique flag string (e.g. `COPILOT_ENABLED`) |
| `name` | `TEXT` | `NOT NULL` | Human-readable flag title |
| `description` | `TEXT` | `NULLABLE` | Explanation of operational scope |
| `enabled` | `BOOLEAN` | `NOT NULL DEFAULT false` | Whether feature flag is currently active |
| `environment` | `TEXT` | `NOT NULL DEFAULT 'development'` | Target tier (`development`, `staging`, `production`) |
| `rollout_scope` | `TEXT` | `NOT NULL DEFAULT 'GLOBAL'` | `GLOBAL`, `BRANCH`, `PILOT`, `ADMIN_ONLY` |
| `owner` | `TEXT` | `NULLABLE` | Engineering or Product owner |
| `metadata` | `JSONB` | `NULLABLE` | Parameter constraints or telemetry tags |
| `created_at` | `TIMESTAMP` | `NOT NULL DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMP` | `NOT NULL DEFAULT NOW()` | Last modification timestamp |

**Indexes**:
- `idx_feature_flags_key`: `flag_key`
- `idx_feature_flags_env`: `environment`

---

### 4.2 Table: `security_events`
Tracks security alerts, IDOR attempts, authorization denials, and authentication anomalies with data minimization.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` | Primary key identifier |
| `event_id` | `TEXT` | `NOT NULL UNIQUE` | Business event code (`SEC-2026-0001`) |
| `event_type` | `TEXT` | `NOT NULL` | Category (`AUTH_FAILURE`, `AUTHORIZATION_FAILURE`, `IDOR_ATTEMPT`, etc.) |
| `severity` | `TEXT` | `NOT NULL` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `actor_id` | `TEXT` | `NULLABLE` | Identified user ID or `ANONYMOUS` |
| `target_resource` | `TEXT` | `NULLABLE` | Target URI or entity |
| `request_id` | `TEXT` | `NULLABLE` | Correlation identifier |
| `ip_address` | `TEXT` | `NULLABLE` | Sanitized client IP |
| `user_agent` | `TEXT` | `NULLABLE` | Originating client user agent |
| `outcome` | `TEXT` | `NOT NULL` | `BLOCKED`, `FLAGGED`, `CHALLENGED` |
| `evidence_metadata` | `JSONB` | `NULLABLE` | Non-sensitive context (zero passwords, keys, or tokens) |
| `created_at` | `TIMESTAMP` | `NOT NULL DEFAULT NOW()` | Event timestamp |

**Indexes**:
- `idx_security_events_type`: `event_type`
- `idx_security_events_severity`: `severity`
- `idx_security_events_actor`: `actor_id`

---

### 4.3 Table: `system_settings`
Key-value store for controlled platform settings, maintenance mode state, and system metadata.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` | Primary key identifier |
| `setting_key` | `TEXT` | `NOT NULL UNIQUE` | Unique setting key (`maintenance_mode`, etc.) |
| `value` | `JSONB` | `NOT NULL` | Strongly typed configuration JSON |
| `description` | `TEXT` | `NULLABLE` | Setting documentation |
| `updated_by` | `TEXT` | `NULLABLE` | Actor ID of modifying administrator |
| `updated_at` | `TIMESTAMP` | `NOT NULL DEFAULT NOW()` | Modification timestamp |

**Indexes**:
- `idx_system_settings_key`: `setting_key`
