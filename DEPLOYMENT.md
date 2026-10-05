# COREvia Production Deployment & Environment Runbook

This document details the production deployment architecture, prerequisites, build pipeline, operational commands, and troubleshooting procedures for COREvia.

---

## 1. System Architecture

```text
[ User / Modern Web Browser ]
             │
             │ HTTPS (Browser Ambient Cookie / TLS 1.3)
             ▼
[ Reverse Proxy / Load Balancer / Ingress ]
             │
             │ HTTP (Strict Origin Header & Trust Proxy Hop = 1)
             ▼
[ COREvia Application Server (Node.js Express / TS) ]
     │
     ├── In-Memory Token-Bucket Rate Limiter (Process-local)
     ├── Helmet Security Headers & Strict CORS Allowlist
     ├── Signed Double-Submit / Origin CSRF Guard
     ├── Session Authentication & Role-Based Access Control (15 Domains)
     │
     ├── Core Banking & Financial Graph Engines
     ├── Decision Trace Lineage & Strategy Simulator Sandbox
     ├── Controlled Banking Agent (Two-Stage Human-in-the-Loop Gate)
     │
     ├── Server-Side Gemini AI Client (@google/genai proxy)
     │      └── Deterministic Rule-Based Fallback (Active if key missing)
     │
     └── Drizzle ORM Connection Pool (58 Relational Tables)
             │
             ▼
[ PostgreSQL 16 Relational Database Engine ]
```

---

## 2. Prerequisites & System Requirements

- **Runtime**: Node.js `v20.x` or `v22.x LTS` (Node 22 recommended)
- **Package Manager**: `npm` v10+
- **Database Engine**: PostgreSQL 16+ (local service, RDS, Cloud SQL, or container)
- **Memory**: Minimum 2 GB RAM (4 GB recommended for production workloads)
- **Storage**: Minimum 10 GB persistent storage for PostgreSQL WAL and data directories
- **Reverse Proxy / TLS**: NGINX, Cloud Run Ingress, or AWS ALB terminating TLS 1.2/1.3

---

## 3. Environment Configuration

Copy the sanitized template [.env.example](.env.example) to `.env`:

```bash
cp .env.example .env
```

### Environment Variable Specification

| Variable | Requirement Level | Purpose & Security Constraint |
|---|---|---|
| `NODE_ENV` | **REQUIRED** | Set to `production`. Activates strict secure cookies and suppresses stack traces. |
| `PORT` | **REQUIRED** | Binding port for the Express HTTP server (e.g. `3000`). |
| `DATABASE_URL` | **REQUIRED** | PostgreSQL connection URI (`postgresql://user:pass@host:5432/corevia`). |
| `SESSION_SECRET` | **REQUIRED** | Minimum 32-character secret key used to sign sessions and CSRF tokens. |
| `APP_URL` | **REQUIRED** | Canonical public URL (e.g. `https://corevia.example.com`). Required to anchor CORS and CSRF allowlists. |
| `CORS_ALLOWED_ORIGINS` | Optional (Prod) | Comma-separated list of additional trusted origins (e.g. `https://demo.corevia.com`). Wildcards prohibited. |
| `GEMINI_API_KEY` | Optional | Google Gemini API key. Confined strictly to backend server; falls back deterministically if absent. |
| `GEMINI_MODEL` | Optional | AI Model identifier. Defaults to `gemini-3.8-flash`. |

> [!CAUTION]
> In production (`NODE_ENV=production`), `validateEnvironment` halts server startup if `SESSION_SECRET` uses default development placeholders, if `DATABASE_URL` is omitted, or if `APP_URL` is invalid.

---

## 4. Installation & Build Pipeline

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Database Schema Migration
Push migrations directly to the PostgreSQL instance via Drizzle Kit:
```bash
# Push schema definitions (creates all 58 core banking tables)
npm run db:migrate
```

### Step 3: Database Seeding (Development & Staging Only)
```bash
# Seeds synthetic Indian banking personas, CASA accounts, and loans
npm run seed
```
> [!IMPORTANT]
> The database seed script contains an internal safeguard preventing unintended execution against production databases.

### Step 4: Production Build
Compile the client assets via Vite and bundle the Express server via esbuild:
```bash
npm run build
```
Build outputs generated:
- `dist/index.html` + `dist/assets/*`: Minified React 19 single-page application.
- `dist/server.cjs`: Standalone bundled Node.js server with sourcemaps.

---

## 5. Starting the Production Application

Run the compiled production bundle:
```bash
npm run start
```
*(Executes `node dist/server.cjs` using environment variables).*

For local development with live TypeScript execution:
```bash
npm run dev
```

---

## 6. Health & Readiness Verification

Once started, verify service operational status:

```bash
# 1. Operational Health (Uptime, database connectivity, service tag)
curl -s http://localhost:3000/api/health

# Expected response (HTTP 200):
# {"status":"HEALTHY","timestamp":"2026-10-05T...","service":"COREvia Banking CRM"}

# 2. Database Readiness Check
curl -s http://localhost:3000/api/health/ready

# Expected response (HTTP 200):
# {"ready":true,"timestamp":"2026-10-05T..."}
```

---

## 7. Graceful Shutdown & Process Lifecycle

COREvia registers listeners for `SIGTERM` and `SIGINT`:
1. Ceases accepting new HTTP connections.
2. Waits up to 10 seconds for in-flight requests to complete.
3. Closes PostgreSQL connection pools.
4. Exits process with code `0`.

---

## 8. Troubleshooting Guide

| Issue | Cause | Resolution |
|---|---|---|
| **EADDRINUSE (Port occupied)** | Port 3000 is held by another process. | Check with `lsof -i :3000`. Free the port or run with another port: `PORT=3001 npm run start`. |
| **CRITICAL: Server startup aborted** | Production environment configuration failed. | Inspect console logs. Ensure `SESSION_SECRET` is >= 32 chars, `APP_URL` is valid HTTPS, and `DATABASE_URL` is configured. |
| **Database Connection Failure** | PostgreSQL is unreachable or credentials incorrect. | Verify PostgreSQL is running (`pg_isready`), check network security groups, and test connection string. |
| **CSRF_VALIDATION_FAILED (403)** | Request origin is not in allowlist or missing CSRF token. | Ensure incoming browser requests originate from `APP_URL` or an entry in `CORS_ALLOWED_ORIGINS`. |
| **Copilot reports NOT_CONFIGURED** | `GEMINI_API_KEY` is not present in `.env`. | Normal fallback behavior. System functions deterministically without crashing. Add key if generative capabilities are desired. |
| **Build Failure (`npm run build`)** | Missing TypeScript types or syntax mismatch. | Run `npm run typecheck` to locate compile errors before rebuilding. |
