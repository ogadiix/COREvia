# COREvia CRM Workflows & Relationship Operations

## 1. Overview
COREvia integrates customer lifecycle management, service recovery, commercial opportunities, and relationship group intelligence into governed operational workflows.

---

## 2. Household & Business Group 360 Workflows (Phase 34)

### 2.1 Group Discovery & Portfolio Navigation
1. **Portfolio Search (`/groups`)**:
   - Bankers access the Portfolio Groups View to monitor family households and corporate entities.
   - Filter by Group Type (`All`, `Households`, `Business Groups`, `My Groups`, `Needs Attention`).
   - High-priority attention badges flag groups with critical open cases or stalled high-value opportunities.
2. **Contextual Navigation**:
   - Customer 360 includes direct links to Household 360 from the header and relationship graph.
   - Global Search indexing supports direct lookup via Group ID (`HH-10482`, `BIZ-10482`) and member names.

### 2.2 Controlled Ownership Handoff Workflow
1. **Initiation**: An RM or Branch Manager selects "Change Owner" on the Group Workspace.
2. **Target Assignment**: Chooses a destination officer from the authorized personnel list.
3. **Mandatory Justification**: Provides required audit reason (e.g. "Annual portfolio rebalancing").
4. **Execution & Audit**:
   - Updates `relationship_groups.relationship_manager_id`.
   - Sends real-time notification to the incoming Relationship Manager (`JOURNEY_STEP_ASSIGNED`).
   - Records an immutable audit log (`GROUP_OWNER_CHANGED`) capturing previous and new owners.

### 2.3 Member Privacy & Cross-Customer IDOR Defense
- **Dynamic Resource Scoping**:
  - The Group 360 UI evaluates officer permissions for each individual member.
  - If an officer lacks assignment to Member B (e.g. Priya Sharma), Member B's sensitive identifiers are masked as `"Protected Member (Restricted Access)"` and their financial balance is excluded from aggregated group relationship value totals.
  - Officers cannot access protected member accounts, opportunities, or service cases via group drilldowns.

### 2.4 Controlled Banking Agent Multi-Entity Recovery Plan
1. **Proposal**: Officer launches Agent Group Recovery (`proposeGroupRecovery`).
2. **Multi-Entity Action Draft**:
   - Step 1: Prioritize and escalate open service cases for authorized members.
   - Step 2: Schedule a comprehensive household relationship review.
   - Step 3: Follow up on stalled commercial opportunities for affiliated corporate entities.
   - Step 4: Notify the assigned Relationship Manager.
3. **Human Approval**: The plan is created in `AWAITING_APPROVAL` status. No actions execute autonomously.
4. **Governed Execution**: The banker reviews and confirms each action before execution occurs through existing Core Banking transactional pipelines.
