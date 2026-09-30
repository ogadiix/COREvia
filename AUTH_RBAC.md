# COREvia Enterprise Authentication & RBAC Policy

## 1. Authentication Architecture
- **Session Authentication**: Cookie-backed HTTP-only sessions signed with server secret.
- **CSRF Protection**: Double-submit cookie with `X-CSRF-Token` validation on state-altering requests.
- **Identity Isolation**: User identities (`actorId`, `name`, `role`, `department`, `branchId`) are attached to `req.user`.

---

## 2. Enterprise Banking Roles

| Role | Domain Responsibilities | Governance Center Visibility |
|---|---|---|
| `ADMINISTRATOR` | System administration, platform configuration, user provisioning | Full system-wide visibility across all 12 tabs; can assign/dismiss/resolve exceptions |
| `COMPLIANCE_OFFICER` | Regulatory compliance, AML/KYC review, audit inspection | Full audit, AI, agent, decision, export, access, and exception management |
| `BRANCH_OPS_HEAD` | Branch operational control, maker-checker escalation oversight | Approvals, agent plans, decision traces, operational health, branch-scoped audit |
| `RELATIONSHIP_MANAGER` | Customer portfolio management, commercial review execution | Portfolio-scoped customer access; self-scoped agent plans & approvals; security tab restricted |
| `AUDITOR` | Independent internal/external banking examination | Read-only inspection of audit explorer, decision traces, export records, tamper-evident chains |
| `TELLER` | Branch counter cash & account transactions | Operational counter functions only; **strictly barred from governance endpoints & tools (403 Forbidden)** |

---

## 3. Trust & Governance Center Permissions (Phase 35)

Governance access is compartmentalized into specific permissions:

| Permission Code | Permitted Roles | Functional Scope |
|---|---|---|
| `GOVERNANCE_VIEW` | `ADMINISTRATOR`, `COMPLIANCE_OFFICER`, `BRANCH_OPS_HEAD`, `RELATIONSHIP_MANAGER`, `AUDITOR` | View `/governance` overview dashboard, system status, and high-level activity metrics |
| `GOVERNANCE_AUDIT_VIEW` | `ADMINISTRATOR`, `COMPLIANCE_OFFICER`, `BRANCH_OPS_HEAD`, `AUDITOR` | Query Audit Explorer, filter by actor/module/resource, verify cryptographic hash chain |
| `GOVERNANCE_AI_VIEW` | `ADMINISTRATOR`, `COMPLIANCE_OFFICER`, `BRANCH_OPS_HEAD` | Inspect Copilot telemetry, source classification (Deterministic vs. AI), Gemini status |
| `GOVERNANCE_AGENT_VIEW` | `ADMINISTRATOR`, `COMPLIANCE_OFFICER`, `BRANCH_OPS_HEAD`, `RELATIONSHIP_MANAGER` (scoped) | Review Autonomous Agent plans, approved/rejected steps, execution outcomes |
| `GOVERNANCE_SECURITY_VIEW` | `ADMINISTRATOR`, `COMPLIANCE_OFFICER` | Inspect security events, failed logins, authorization denials, session expirations |
| `GOVERNANCE_DATA_VIEW` | `ADMINISTRATOR`, `COMPLIANCE_OFFICER`, `AUDITOR` | Data lineage graph inspection, customer/group context access logs |
| `GOVERNANCE_EXPORT_VIEW` | `ADMINISTRATOR`, `COMPLIANCE_OFFICER`, `AUDITOR` | Lightweight export tracking logs, data exfiltration risk monitoring |
| `GOVERNANCE_EXCEPTION_MANAGE` | `ADMINISTRATOR`, `COMPLIANCE_OFFICER` | Exception workflow management: acknowledge, assign, resolve, dismiss exceptions |
| `GOVERNANCE_CONFIG_VIEW` | `ADMINISTRATOR`, `COMPLIANCE_OFFICER` | Safe model configuration and infrastructure health status inspection |

---

## 4. Least Privilege & Resource Scoping Rules

1. **Self-Scoped RM Isolation**:
   - Relationship Managers can only inspect agent plans, decision traces, and approvals generated for customers assigned to their active portfolio or initiated by themselves.
   - Cross-branch or cross-RM access attempts are rejected with `403 Forbidden`.
2. **Neutral Monitoring Guarantee**:
   - Authorization failures are logged with neutral system terminology (`"Authorization failure"`, `"Repeated authorization failures"`).
   - No subjective user profiling or unverified "Trust Scores" are permitted.
3. **Controlled AI Agent Security Boundary**:
   - The Controlled Banking Agent is strictly barred from modifying user roles, disabling audit logging, dismissing exceptions, or altering Gemini security settings.
