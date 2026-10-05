# COREvia Environment Configuration & Operating Boundaries

This document defines the environment variable requirements, runtime behavior, and deployment boundaries for the COREvia Banking Platform.

---

## 1. Environment Variables Specification

COREvia utilizes centralized validation (`src/lib/env.ts`) executed at server startup.

| Variable Name | Required (Prod) | Default (Dev) | Description | Security Constraints |
|---|---|---|---|---|
| `NODE_ENV` | Yes | `development` | Operating mode: `development`, `production`, or `test`. | Governs error verbosity and cookie security flags. |
| `PORT` | No | `3000` | Port for the Express HTTP server to bind. | Standard HTTP port. |
| `DATABASE_URL` | **Yes** | `postgresql://...` | PostgreSQL 16 connection URI. | **Confidential**. Never exposed in logs, API responses, or frontend. |
| `SESSION_SECRET` | **Yes** | Dev fallback | Secret key used to sign session cookies and CSRF tokens. | **Strictly required in production (min 32 chars)**. Never committed to VCS. |
| `APP_URL` | **Yes** | `http://localhost:3000` | Canonical public URL of the application. | **Required in production** to anchor trusted CORS and CSRF origins. |
| `CORS_ALLOWED_ORIGINS`| No | Derived from `APP_URL` | Comma-separated list of explicit allowed cross-origins. | Rejects wildcards (`*`); must contain fully qualified origins (protocol + host + port). |
| `GEMINI_API_KEY` | Optional | None | Google Gemini AI API key for server-side Copilot features. | **Server-side only**. Client never receives this key. Operates with deterministic fallback if absent. |
| `GEMINI_MODEL` | No | `gemini-3.8-flash` | Gemini model name used by backend AI services. | Standardized across platform to `gemini-3.8-flash`. |

---

## 2. Server Startup Validation (`src/lib/env.ts`)

During startup, the server validates configuration prior to binding listeners:

1. **Production Invariants**:
   - `SESSION_SECRET` must be set and cannot equal weak development defaults (`development-secret-key-...`). Minimum length: 32 characters.
   - `DATABASE_URL` must be configured with a valid PostgreSQL URI.
   - `APP_URL` must be provided as a valid absolute URL (e.g., `https://corevia.example.com`).
2. **Safe Startup Reporting**:
   - Validation emits structured configuration summaries with all secrets masked (e.g. `SESSION_SECRET: [CONFIGURED - 48 chars]`, `DATABASE_URL: [CONFIGURED - postgresql://...]`).
   - If validation fails, errors are logged gracefully without unhandled crashes.

---

## 3. Server-Side AI & Deterministic Fallback

- **Zero Client-Side Exposure**: `GEMINI_API_KEY` is confined strictly to Node.js backend services.
- **Graceful Deterministic Fallback**: When `GEMINI_API_KEY` is not provided or invalid:
  - The application **does not fail or crash**.
  - Copilot and AI services gracefully degrade to deterministic, rule-based responses.
  - Telemetry reports Gemini status as `NOT_CONFIGURED` or `MISSING` without operational disruption.

---

## 4. Operating Boundaries & Synthetic Environment

COREvia is engineered as a production-grade enterprise core banking relationship architecture and demonstration platform.

- **Synthetic Data Store**: All customer master profiles (e.g., Rahul Sharma `CUS-10482`, Kalyan Steels), account balances, loan facilities, and relationship graphs reside on a synthetic Indian banking dataset.
- **Simulated External Rails**: External payment rails (UPI, IMPS, NEFT, RTGS) and regulatory verification registries (cKYC, PAN, Aadhaar) are simulated via internal adapters and circuit breakers; they do not link to live banking networks.
- **Governed Execution**: Controlled AI actions always enforce human-in-the-loop confirmation before database mutation.

---

## 5. Security & Rate Limiting Disclosures

- **Cookie-Only Authentication**: Web browser sessions rely entirely on HTTP-only `corevia_session` cookies; JSON endpoints never return raw session credentials.
- **Explicit CORS Allowlist**: CORS origins must be explicitly enumerated in `CORS_ALLOWED_ORIGINS` or match `APP_URL`. Untrusted client headers (`Host`, `X-Forwarded-Host`) are never reflected.
- **Process-Local Rate Limiting**: The built-in rate limiter is an in-memory token bucket designed for single-instance synthetic/local deployment. Horizontally scaled multi-instance deployments require Redis or an equivalent shared distributed state store.
- **Reverse Proxy**: Conservative trust proxy (`app.set('trust proxy', 1)`) is enabled to safely evaluate client IPs behind a single upstream load balancer or reverse proxy.
