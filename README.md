# COREvia — Institutional Core Banking Platform

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle)](https://orm.drizzle.team/)
[![Gemini](https://img.shields.io/badge/Gemini_API-Server--Side-4285F4?logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#)

<p align="center">
  <strong>Next-Generation Institutional Core Banking & Financial Relationship Intelligence</strong><br/>
  Engineered for Indian Banking Regulatory Compliance, Document Intelligence, Maker-Checker Dual Control, and Autonomous AI Copilot Capabilities.
</p>

</div>

---

## 📌 Overview

**COREvia** is an institutional-grade core banking relationship management platform engineered for modern commercial and retail banking institutions. It delivers high-throughput transaction processing, comprehensive Indian banking regulatory workflow patterns (simulated cKYC, RBI compliance frameworks, CTR/STR monitoring), intelligent document lifecycle processing, dynamic relationship twin modeling, and contextual AI-driven decisioning powered by server-side Gemini 3.8 Flash.

> [!NOTE]
> **Data Environment**: All customer profiles, accounts, loans, KYC records, and relationship graphs in this repository utilize a **synthetic banking dataset**. It does not connect to live banking networks or real customer accounts.

From front-office branch operations and KYC/KYB onboarding to back-office maker-checker approvals, treasury liquidity, lending underwriting, and automated regulatory reporting, COREvia provides a unified, secure, and resilient banking operating system.

---

## ⚖️ Implementation Scope: Real vs. Synthetic

| Real Implemented Architecture | Synthetic & Simulated Scope |
|---|---|
| Full-stack TypeScript (React 19 + Express.js 4) | Synthetic customer profiles (e.g. Rahul Sharma, Kalyan Steels) |
| Relational PostgreSQL 16 schema (58 banking tables via Drizzle ORM) | Simulated banking transaction ledgers & account numbers |
| Enterprise RBAC & resource-level ownership (IDOR defense) | Simulated cKYC registry & UIDAI/PAN verification APIs |
| Deterministic graph traversal & bounded BFS shortest-path algorithms | Simulated payment clearing switch (UPI/IMPS/NEFT rails) |
| Server-side Google Gemini 3.8 Flash Copilot integration with RBAC tools | Synthetic KYC/KYB documents & collateral agreements |
| Maker-checker dual-control governance & immutable audit logging | Regulatory compliance aligned with RBI norms (simulated sandbox) |
| AI Decision Trace & Explainability engine with evidence lineage | Governed human-in-the-loop review (Confirm / Reject / Execute) |

---

## 🏛️ Core Capabilities & Modules

### 1. 💼 Accounts & Liquidity Management
- **CASA & Term Deposits**: Comprehensive Current Account, Savings Account, Recurring Deposits, and Fixed Deposits management.
- **Lien & Hold Management**: Regulatory, judicial, and collateral lien placement and release workflows.
- **Ledger Balances**: Real-time reconciliation with strict isolation between available balance, ledger balance, and frozen funds.

### 2. 🪪 Digital Onboarding & KYC/KYB Workspace
- **cKYC & Verification Workflow Simulation**: Automated pipelines modeling verification for PAN, Aadhaar (masked/UIDAI compliant format), and GSTIN.
- **Risk Profiling**: Dynamic Low / Medium / High AML risk tiering calculated at the point of customer onboarding.
- **Maker-Checker Workflows**: High-value and high-risk customer onboarding actions require dual authorization.

### 3. 💳 Payments Switch & Multi-Rail Settlement
- **Multi-Rail Clearing Simulation**: Simulated switch for UPI, IMPS, NEFT, RTGS, and NACH rails.
- **ISO 20022 Compliant Messaging**: Structured transaction payloads with idempotency keys and end-to-end auditability.
- **Real-Time Settlement & Reconciliation**: Transaction status monitoring with automated exception queues.

### 4. 📈 Lending & Credit Underwriting
- **Credit Lifecycle**: Origination, multi-stage credit assessment, collateral valuation, and loan disbursement.
- **Amortization & Schedule Engine**: Dynamic EMI schedules, repayment tracking, delinquency alerting, and provisioning.

### 5. 📑 Document Intelligence & Secure Vault
- **OCR & Document Extraction**: Automated document ingestion with AI-assisted verification of financial statements, identity cards, and legal agreements.
- **Tamper-Evident Storage**: Audit-stamped document records with strict access controls.

### 6. 🌐 Relationship Intelligence & Graph Engine
- **Customer 360° Profile**: Unified view across deposit accounts, loans, investments, service tickets, and interactions.
- **Relationship Graph**: Bounded BFS network intelligence connecting family offices, corporate parent-subsidiary networks, and authorized signatories.
- **Opportunity Radar & Next Best Action (NBA)**: Predictive analytics pinpointing cross-sell, risk mitigation, and retention interventions.

### 7. 🛡️ Dual-Control Maker-Checker Governance
- **Institutional Governance**: Two-person rule enforcement for high-value transactions, limit alterations, and sensitive master data updates.
- **Immutable Audit Trail**: Chronological event logs capturing user, role, IP address, timestamp, and diff snapshots.

### 8. 🤖 Contextual Gemini Banking Copilot
- **Secure Server-Side Architecture**: Zero client-side API key leakage; all AI requests are sanitized, rate-limited, and proxied through Node.js.
- **Financial Semantic Querying**: Real-time portfolio summaries, compliance guideline lookups, credit risk synthesis, and natural language core banking navigation.
- **Strict Grounding & Explainability Rules**: Governed Copilot tools classifying assertions into FACT, EVIDENCE, INTERPRETATION, RECOMMENDATION, and LIMITATION.

### 9. 🔍 AI Decision Trace & Explainability Platform
- **Deterministic & Governed Explainability**: Answers *"Why did COREvia recommend, flag, prioritize, or summarize this?"* across CORE Score, Next Best Action, Opportunity Radar, and Signal Center.
- **Evidence Lineage & Source Chains**: Explicit primary and supporting evidence weighted by contribution, linked to source systems, engine versions, and freshness timestamps.
- **Human-in-the-Loop Governance**: Confirm, reject (with mandatory reason), or execute recommended actions with immutable audit records.
- **Side-by-Side Trace Comparison**: Bounded comparative analysis highlighting evidence deltas and metric evolutions across customer decision history.
- **Zero Information Leakage**: Strict RBAC and portfolio-scoped IDOR prevention ensuring cross-customer isolation.

### 10. 🧭 Relationship Strategy Simulator & What-If Sandbox
- **Non-Destructive What-If Simulation**: Answers *"What would the relationship look like if I changed this strategy?"* without mutating live production customer, account, or case records.
- **Multi-Action Pipeline & Step Ladder**: Deterministic sequential evaluation of up to 9 supported banking actions (ticket resolution, review scheduling, commitment delivery, interaction logging, opportunity follow-up) with intermediate metric state tracking.
- **Before / After Comparison Grid**: Full comparative metrics across CORE Score, Relationship Momentum, Service Health, Engagement Score, Product Depth, and Relationship Value with advantage highlighting.
- **Governed Action Bridge**: Transition simulated actions to real Core Banking execution (CRM tasks, service ticket resolution) requiring explicit human confirmation notes and audit trail (`STRATEGY_SIMULATION_ACTION_APPLIED`).
- **Explainability & Copilot Tools**: Decision Trace integration (`STRATEGY_SIMULATION`), staleness detection, side-by-side scenario comparison, and 5 dedicated Copilot tools.

### 11. 🛡️ Controlled Banking Agent & Governed Execution
- **Strict Human-in-the-Loop Boundaries**: Read-only autonomous context gathering coupled with strictly gated two-step execution (Propose Plan -> Human Approval -> Execute Plan).
- **Zero Autonomous Execution**: High-impact state transitions (ticket creation, customer status change, review scheduling) cannot execute autonomously without explicit officer confirmation.
- **Safety Allowlist & Context Resolvers**: Hard allowlist of approved actions and strict customer IDOR isolation preventing cross-customer access.

### 12. 💎 Relationship Value Intelligence & Portfolio Scenarios
- **Multidimensional Value Modeling**: Comprehensive institutional value assessment without synthetic or fabricated currency precision.
- **Trajectory Analysis & Explanations**: Historical trajectory tracking, dimension contribution explanations, and non-destructive scenario delta simulations.
- **Portfolio Health & Governance**: Scoped aggregation across branches and segments with zero production mutation.

### 13. 🗺️ Customer Journey Orchestrator & Lifecycle Management (Phase 33)
- **Governed Multi-Step State Machine**: Manages the complete customer lifecycle from onboarding to retention across 10 canonical templates with explicit status flow (`PENDING` -> `READY` -> `IN_PROGRESS` -> `COMPLETED` / `BLOCKED`).
- **Prerequisite Dependencies & Cascading**: Automated dependency resolution ensuring steps cannot progress until preceding compliance steps complete.
- **Authoritative Evidence Verification**: Validates completion claims directly against authoritative COREvia tables (`documents`, `tasks`, `serviceCases`, `opportunities`, `interactions`, `customerOpportunityRadar`).
- **SLA Tracking & Controlled Escalations**: Dynamic SLA deadline monitoring (`ON_TRACK`, `AT_RISK`, `BREACHED`) with governed officer handoffs and Decision Trace (`DT-...`) linkages.
- **Portfolio Analytics & Copilot Tools**: Portfolio-wide bottleneck detection, completion tracking, 7 Copilot tools (`getJourney`, `getJourneyTimeline`, `getJourneyBlockers`, `getJourneyEvidence`, etc.), and Controlled Agent journey recovery planning.

---

## 🏗️ Architecture

```text
                     ┌────────────────────────────────┐
                     │    User Browser / Frontend     │
                     │  React 19 + TypeScript + Vite  │
                     └───────────────┬────────────────┘
                                     │ HTTPS / WSS
                                     ▼
                     ┌────────────────────────────────┐
                     │       Express.js Server        │
                     │  RBAC • Rate Limiter • CSRF    │
                     └───────┬──────────────┬─────────┘
                             │              │
             ┌───────────────┴────┐    ┌────┴──────────────────────────┐
             ▼                    │    ▼                               ▼
   ┌───────────────────┐          │ ┌──────────────────┐    ┌────────────────────┐
   │ PostgreSQL DB     │          │ │ Google Gemini AI │    │ External Switches  │
   │ Drizzle ORM       │          │ │ (Server-side API)│    │ (UPI, cKYC, NEFT)  │
   └───────────────────┘          │ └──────────────────┘    └────────────────────┘
                                  ▼
                     ┌─────────────────────────┐
                     │ Notification Engine &   │
                     │ Audit Logging Subsystem │
                     └─────────────────────────┘
```

---

## 💻 Tech Stack

| Domain | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts, Framer Motion |
| **Backend** | Node.js (v22+), Express 4, TypeScript (`tsx` runtime) |
| **Database & ORM** | PostgreSQL 16, Drizzle ORM, Drizzle Kit |
| **AI / LLM** | Google Gemini 3.8 Flash (`@google/genai` via backend proxy) |
| **Security & Auth** | Cookie-based session auth, bcryptjs, RBAC middleware, Helmet headers, Rate limiting |
| **Containerization** | Docker, Docker Compose |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **npm**: v10+ (canonical package manager)
- **PostgreSQL**: v16+ (local or via Docker Compose)
- **Google Gemini API Key** (optional for server-side AI Copilot features)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/ogadiix/COREvia.git
cd COREvia
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in the required values:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/corevia
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
SESSION_SECRET=your_super_secret_session_key
```

### 3. Setup Database Schema & Seed Data
```bash
# Push schema migrations
npm run db:migrate

# Seed initial institutional sample data (Indian banking personas, accounts, loans)
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🐳 Docker Deployment

Run the complete stack (COREvia Node app + PostgreSQL database) using Docker Compose:

```bash
docker-compose up --build -d
```

To stop:
```bash
docker-compose down
```

---

## 🛠️ Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts server and client with hot reload via `tsx` |
| `npm run build` | Builds production client via Vite and bundles Node server |
| `npm run start` | Runs compiled production server (`dist/server.cjs`) |
| `npm run lint` | Runs TypeScript compilation type-checking without emitting |
| `npm run test` | Executes backend test suites |
| `npm run db:generate`| Generates migration SQL files with Drizzle Kit |
| `npm run db:migrate` | Applies database schema migrations |
| `npm run db:seed` | Seeds synthetic banking data (disabled in production) |
| `npm run db:studio` | Launches Drizzle Studio GUI for visual database management |

---

## 🔒 Security & Compliance Standards
 
- **Simulated Regulatory Compliance**: Built aligned with Reserve Bank of India (RBI) procedural patterns for transaction auditing, simulated cKYC workflows, CTR/STR monitoring, and maker-checker dual authorization. Default environments run on synthetic data.
- **Strict Server-Side AI**: Gemini API keys never reach the client; queries are validated, sanitized, rate-limited, and executed server-side.
- **Defense in Depth**: Role-Based Access Control (Admin, Maker, Checker, Officer, Auditor) with IDOR prevention, CSRF mitigation, payload caps, and DTO allowlisting.
- **Disaster Recovery**: See [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md) and [OPERATIONS.md](OPERATIONS.md) for production operational runbooks.

---

## 📄 License & Attribution

Designed and maintained for enterprise banking operations.  
© 2026 COREvia Systems. All rights reserved.
