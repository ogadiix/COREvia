# COREvia AI & Decision Explainability Specification

## 1. AI Integration Architecture

COREvia uses **Google Gemini 3.8 Flash** strictly within a server-side orchestrated environment. The frontend React application never communicates directly with Google Gemini APIs or stores Google API keys.

```text
┌───────────────────────┐
│     Client Browser    │
│  (React 19 Frontend)  │
└───────────┬───────────┘
            │ POST /api/copilot/message (Authenticated session + CSRF)
            ▼
┌────────────────────────────────────────────────────────┐
│               Node.js Express Server                   │
│                                                        │
│  1. Session & RBAC Authentication                      │
│  2. Portfolio Scope & IDOR Verification                │
│  3. Input Sanitization & Prompt Injection Scrubbing    │
│  4. Gemini SDK Execution (Function Calling)            │
│  5. Copilot Tool Handlers (Deterministic DB Queries)   │
│  6. Audit Event Logging (`COPILOT_QUERY`, etc.)        │
└───────────┬────────────────────────────┬───────────────┘
            │ Function Calls             │ Direct Tool Execution
            ▼                            ▼
┌───────────────────────┐    ┌───────────────────────────┐
│  Google Gemini 3.8    │    │   PostgreSQL 16 DB        │
│  (Server-to-Server)   │    │   (58 Managed Tables)     │
└───────────────────────┘    └───────────────────────────┘
```

---

## 2. Decision Trace Copilot Tools

In Phase 29, the Copilot received direct explainability inspection tools:

| Tool Name | Parameters | Description | Security Controls |
|---|---|---|---|
| `getDecisionTrace` | `decisionId` (string) | Fetches complete decision trace rationale, engine version, confidence, and status | Validates customer ownership against user role |
| `getDecisionEvidence` | `decisionId` (string) | Retrieves structured evidence items categorized into primary and supporting | Logs `DECISION_TRACE_EVIDENCE_VIEWED` |
| `getDecisionSources` | `decisionId` (string) | Returns data lineage and source systems with freshness timestamps | Logs `DECISION_TRACE_SOURCES_VIEWED` |
| `getDecisionHistory` | `customerId` (number) | Retrieves chronological list of decision traces for a customer | Enforces portfolio scoping (`resourceAuth.authorizeCustomer`) |

---

## 3. Explainability & Grounding Rules

The Copilot is governed by strict system instructions (`COPILOT_SYSTEM_INSTRUCTION`):

### Rule 8: Explainability & Grounding
When explaining recommendations, risk alerts, CORE scores, or prioritization:
1. Explain the **primary rationale** and distinguish it from secondary background context.
2. List the **specific evidence items** that contributed, indicating whether each had positive, negative, or neutral impact.
3. Identify the **source engine** and **model/rules version**.
4. State whether the recommendation is **confirmed, pending review, or executed**.
5. Explicitly state **limitations or missing data** (e.g., "GST returns unavailable", "Recent bureau pull is pending").

### Rule 9: Visible Evidence Classification
When an explanation is requested, the Copilot must visibly classify statements using standardized tags:
- `[FACT]`: Raw data verified in the core database (e.g., "Current CASA balance is ₹14,20,000").
- `[EVIDENCE]`: Observed patterns or signals (e.g., "Average monthly inward remittances grew by 34% over Q2").
- `[INTERPRETATION]`: Analytical reasoning linking evidence to conclusions (e.g., "Indicates surplus operational liquidity suitable for short-term sweep").
- `[RECOMMENDATION]`: Proposed banking action (e.g., "Propose 91-day auto-sweep fixed deposit").
- `[LIMITATION]`: Missing parameters or confidence boundaries (e.g., "Customer external tax filing not refreshed since FY25").

---

## 4. Hallucination Prevention & Synthetic Data Safeguards

1. **No Direct DB Access for Gemini**: Gemini does NOT execute SQL or inspect raw database connections. It only interacts via bounded, strongly typed tool functions.
2. **Deterministic Fallbacks**: If Gemini is offline, throttled, or returns an error, COREvia gracefully falls back to deterministic decision inspection panels.
3. **No Fabricated Confidence**: The system forbids inventing confidence metrics when engines do not provide them.
4. **Synthetic Data Sandbox**: All accounts, PANs, Aadhaar numbers, and company names are synthetic representations adhering to regulatory structures.
