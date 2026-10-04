# COREvia Enterprise Integration & API Gateway (Phase 38)

## 1. Architectural Overview

COREvia Phase 38 introduces an enterprise-grade **Integration Architecture & API Gateway** foundation designed to govern external connectivity, internal service bridging, synthetic simulator execution, and asynchronous webhook delivery.

```
+-----------------------------------------------------------------------------+
|                                COREvia CLIENT                               |
|        (Browser SPA, Operational Desks, Copilot Deterministic Tools)        |
+---------------------------------------+-------------------------------------+
                                        |
                                        | HTTPS / Encrypted Bearer Token / API Key
                                        v
+-----------------------------------------------------------------------------+
|                             INTERNAL API GATEWAY                            |
|  - Route Registry & Versioning (/api/v1/integrations/...)                   |
|  - Dual Authentication (Session Bearer / SHA-256 Hashed API Keys)          |
|  - Rate Limiting (Token Bucket per Integration & Service Key)               |
|  - Idempotency Gate (SHA-256 Request Body Hash + Idempotency-Key Header)    |
|  - Circuit Breakers (CLOSED / HALF_OPEN / OPEN with Bounded Escalation)     |
|  - Bounded Timeouts (Configurable per adapter, default 3000ms - 5000ms)     |
|  - Masked Audit Telemetry (Zero Plaintext Secrets, Masked PAN/Aadhaar)      |
+---------------------------------------+-------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------+
|                           ADAPTER REGISTRY LAYER                            |
|             (IntegrationAdapter Abstraction & Lifecycle Control)            |
+---------------------------------------+-------------------------------------+
                                        |
           +----------------------------+----------------------------+
           |                                                         |
           v                                                         v
+-------------------------------+                     +-------------------------------+
|     SYNTHETIC SIMULATORS      |                     |    FUTURE EXTERNAL RAILS      |
|  - Core Banking Simulator     |                     |  - Core Banking Direct API    |
|  - KYC & Identity Simulator   |                     |  - National Verification APIs |
|  - Document Vault Simulator   |                     |  - Payment Aggregators        |
|  - Payments Simulator (RTGS)  |                     |  - Enterprise Webhooks        |
|  - Multi-Channel Notification |                     |  - Regulatory Reporting       |
|  * Strictly SIMULATED status  |                     |  * Requires physical contract |
|  * Synthetic Data Watermark   |                     |    and verified credentials   |
+-------------------------------+                     +-------------------------------+
```

---

## 2. Integration Modes & Strict Status Rules

COREvia strictly segregates integration operational states to guarantee enterprise transparency:

| Mode | Allowed Statuses | Regulatory & Integrity Rule |
| :--- | :--- | :--- |
| `SIMULATOR` | `SIMULATED`, `DISABLED`, `DEGRADED`, `FAILED` | **Never displayed as `CONNECTED`**. All outputs contain explicit disclaimer: `SIMULATED DATA — NOT REAL EXTERNAL BANKING CONNECTIVITY`. |
| `ADAPTER` | `CONFIGURED`, `AVAILABLE`, `DISABLED`, `FAILED` | Internal adapter wired to sandbox or synthetic endpoints. |
| `EXTERNAL` | `NOT_CONFIGURED`, `CONFIGURED`, `AVAILABLE`, `CONNECTED`, `DEGRADED`, `FAILED`, `DISABLED` | Only displays `CONNECTED` after verified physical cryptographic handshake, active health checks, and dual-control sign-off. |

---

## 3. Synthetic Simulators

COREvia bundles 5 production-grade synthetic simulators with deterministic banking logic:

1. **Core Banking Engine Simulator (`INT-COREBANKING`)**:
   - `getAccount`: Returns master CBS account profile, branch routing, and holder hierarchy.
   - `getBalance`: Returns ledger balance, available balance, and lien amounts.
   - `getTransactions`: Deterministic historical CBS ledger statements with value dates.
   - `createServiceRequest`: Stop-payment, balance confirmation, and lien placement instructions.

2. **National Identity & KYC Gateway Simulator (`INT-KYC`)**:
   - `verifyIdentity`: Masks input PAN and Aadhaar, verifies deterministic tokens.
   - `getKycStatus`: Returns cKYC status, risk category, and re-KYC expiry schedule.
   - `submitReview`: Compliance officer remediation notes.

3. **Enterprise Document Vault Simulator (`INT-DOCMGMT`)**:
   - `uploadMetadata`: Computes SHA-256 document fingerprint, checks mime types and size.
   - `getDocument`: Retrieves sanitized vault references.
   - `verifyDocument`: Automated forensic validation simulation.

4. **Payments & Clearing Simulator (`INT-PAYMENTS`)**:
   - `submitPaymentInstruction`: Enforces idempotency key, generates reference numbers (`TXN-SIM-...`), processes RTGS/NEFT/IMPS settlement rails.
   - `getPaymentStatus`: Real-time clearing status (`SETTLED`, `PENDING_CLEARING`).

5. **Multi-Channel Notification Simulator (`INT-NOTIFICATION`)**:
   - `sendNotification`: Multi-channel dispatch (SMS, Email, Push) with carrier handover IDs.
   - `getDeliveryReport`: Carrier delivery reports and latency telemetry.

---

## 4. API Gateway Capabilities

### 4.1. Idempotency Gate
- Integration mutations accept an `Idempotency-Key` HTTP header.
- The gateway hashes `(key + endpoint + integrationId + requestBody)` using SHA-256.
- If a replay occurs with the exact same payload, the cached response is served immediately without executing backend logic.
- If a duplicate key is submitted with a **mismatched payload**, the gateway strictly rejects with HTTP `422 Unprocessable Entity` (`DUPLICATE_REQUEST_MISMATCH`).

### 4.2. Circuit Breaker Architecture
- Monitored outbound integration requests track consecutive failures.
- States:
  - `CLOSED`: Normal operational state.
  - `OPEN`: Tripped after 5 consecutive failures. Outbound requests fail immediately without stressing downstream systems.
  - `HALF_OPEN`: Resets after 30 seconds to probe a test request.
- **Escalation**: Tripping to `OPEN` automatically creates a Phase 36 **Operational Exception** (`OEX-...`) in the Banking Operations Workspace for administrative triage.

### 4.3. Bounded Retries & Error Classification
- Errors are classified deterministically:
  - `RETRYABLE`: `TIMEOUT`, `NETWORK_ERROR`, `PROVIDER_ERROR` (5xx).
  - `NON_RETRYABLE`: `VALIDATION_ERROR` (400), `AUTHENTICATION_ERROR` (401), `AUTHORIZATION_ERROR` (403), `NOT_FOUND` (404), `DUPLICATE_REQUEST` (422).
- Retry policy enforces a strict maximum of **3 bounded attempts** with exponential backoff. Infinite loops are physically prevented.

### 4.4. Secret & Credential Governance
- Raw API keys and service secrets are generated cryptographically (`crypto.randomBytes(24)`).
- **Displayed only once** upon generation in the modal.
- Only the SHA-256 hash (`key_hash`) and preview prefix (`key_prefix`, e.g., `cv_live_98...`) are stored in PostgreSQL.
- Zero plaintext API keys or secrets exist in the database or frontend code.

---

## 5. Webhook Management & Security

### 5.1. HMAC-SHA256 Verification
- Outbound and inbound webhooks enforce signature validation via `X-Signature-SHA256`.
- Payloads are signed with `crypto.createHmac('sha256', secret).update(body).digest('hex')`.

### 5.2. Replay Protection
- Webhook payloads include an `X-Timestamp` header.
- Timestamps exceeding a 300-second (5 minute) skew are rejected with `SIGNATURE_ERROR`.

---

## 6. Integration Audit & Operations Bridges

- **Operations Workspace (Phase 36)**: Circuit breaker trips and exhausted retry deliveries automatically trigger high-priority Operational Exceptions.
- **Notification Center**: Delivery exhausted notifications alert IT Security and Operations.
- **Signal Center**: Critical infrastructure failures raise institutional risk signals.
- **Global Search**: Integration IDs, endpoints, and webhooks are indexed with strict RBAC filtering.
- **Banking Copilot**: Exposes 6 read-only deterministic tools (`getIntegrations`, `getIntegration`, `getIntegrationHealth`, `getIntegrationEvents`, `getIntegrationFailures`, `getWebhookDeliveries`). Mutations, secret rotations, and HTTP dispatch remain strictly human-controlled.

---

## 7. Enterprise Administration & Governance Center Bridge (Phase 39)

Phase 39 introduces dedicated integration administration visibility inside the `/admin` control plane:
- **Unified Health & Failure Telemetry**: `/admin` provides high-level observability over active integrations, simulator states, failing endpoints, and circuit breaker status without duplicating the integration engine.
- **Bi-directional Navigation**: Seamless deep links connect administrative overviews to the granular `/integrations` gateway workspace.
- **Copilot Admin Read Access**: The `getIntegrationStatus` Copilot tool empowers administrators to retrieve consolidated integration telemetry while strictly barring autonomous mutations or secret modifications.
