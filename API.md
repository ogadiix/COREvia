# COREvia Decision Trace API Specification

## Base URL
`/api/decision-traces`

All requests require an active authenticated session cookie and anti-CSRF token on mutating requests (`POST`).

---

## 1. Endpoints

### 1.1 List Decision Traces
- **Route**: `GET /api/decision-traces`
- **Query Params**:
  - `customerId` (optional, integer): Filter traces by customer ID
  - `sourceEngine` (optional, string): Filter by engine (`CORE_SCORE`, `NBA`, `RADAR`, `SIGNAL_CENTER`, etc.)
  - `decisionType` (optional, string): Filter by type (`RECOMMENDATION`, `RISK_FLAG`, `SCORE_CHANGE`, etc.)
  - `status` (optional, string): Filter by status (`PENDING_REVIEW`, `CONFIRMED`, `REJECTED`, `EXECUTED`)
  - `limit` (optional, integer, default: 50)
  - `offset` (optional, integer, default: 0)
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "decisionId": "DT-20260928-00101",
      "customerId": 1,
      "sourceEngine": "CORE_SCORE",
      "decisionType": "SCORE_CHANGE",
      "decisionMode": "DETERMINISTIC",
      "modelVersion": "rules-v4.2.1",
      "title": "CORE Score Downward Adjustment (780 -> 710)",
      "summary": "Customer score dropped by 70 points due to high-value service ticket dispute.",
      "primaryRationale": "Unresolved transaction failure exceeding 72h SLA with high customer churn probability.",
      "confidence": null,
      "status": "PENDING_REVIEW",
      "createdAt": "2026-09-28T09:00:00.000Z"
    }
  ]
}
```

---

### 1.2 Get Decision Trace Analytics
- **Route**: `GET /api/decision-traces/analytics`
- **Response**:
```json
{
  "success": true,
  "data": {
    "totalTraces": 5,
    "pendingReview": 3,
    "confirmed": 1,
    "rejected": 0,
    "executed": 1,
    "engineBreakdown": {
      "CORE_SCORE": 1,
      "NBA": 1,
      "RADAR": 1,
      "SIGNAL_CENTER": 1,
      "TRADE_FINANCE": 1
    }
  }
}
```

---

### 1.3 Search Decision Traces
- **Route**: `GET /api/decision-traces/search?q={query}`
- **Response**: Returns matching decision traces by code, title, summary, or rationale.

---

### 1.4 Get Trace Details
- **Route**: `GET /api/decision-traces/:id`
- **Parameters**: `:id` - Integer ID or Decision Code (e.g. `DT-20260928-00101`)
- **Response**: Complete `DecisionTraceDTO` object with evidence, source nodes, and calculated freshness.

---

### 1.5 Get Trace Granular Evidence
- **Route**: `GET /api/decision-traces/:id/evidence`
- **Response**:
```json
{
  "success": true,
  "data": {
    "primary": [
      {
        "id": 1,
        "evidenceType": "SERVICE_TICKET",
        "title": "Ticket #SR-4921 Unresolved (>72h)",
        "description": "UPI debit dispute of ₹45,000 pending merchant credit.",
        "weight": "HIGH",
        "contributionType": "NEGATIVE",
        "isPrimary": true
      }
    ],
    "supporting": [
      {
        "id": 2,
        "evidenceType": "TRANSACTION_PATTERN",
        "title": "Clean CASA Payment History",
        "description": "Zero cheque bounces or overdraft incidents over 24 months.",
        "weight": "MEDIUM",
        "contributionType": "POSITIVE",
        "isPrimary": false
      }
    ]
  }
}
```

---

### 1.6 Get Trace Source Nodes & Freshness
- **Route**: `GET /api/decision-traces/:id/sources`
- **Response**: Array of source nodes with `freshnessTimestamp` and real-time calculated freshness duration.

---

### 1.7 Get Customer Decision History
- **Route**: `GET /api/decision-traces/:id/history`
- **Parameters**: `:id` - Customer ID or Decision Code
- **Response**: Chronological history of decision traces for the associated customer.

---

### 1.8 Compare Decision Traces (Same Customer Only)
- **Route**: `GET /api/decision-traces/:id/compare/:otherId`
- **Security**: Returns `400 Bad Request` if traces belong to different customers.
- **Response**: Side-by-side comparison including common, added, and removed evidence, plus confidence and status deltas.

---

### 1.9 Human Governance Actions
- **Confirm**: `POST /api/decision-traces/:id/confirm`
  - Body: `{ "notes": "Approved by branch manager" }`
- **Reject**: `POST /api/decision-traces/:id/reject`
  - Body: `{ "rejectionReason": "Customer opted out of FD allocation" }`
- **Execute**: `POST /api/decision-traces/:id/execute`
  - Body: `{ "executionRef": "TXN-8849102", "notes": "Disbursed via core switch" }`
