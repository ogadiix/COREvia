# COREvia Banking CRM — Rebranding Audit, Inventories & Implementation Plan

**Platform:** COREvia Institutional Banking CRM & Core Banking Platform  
**Architecture:** Multi-Theme Enterprise Web Application (Vite + React 19 + TypeScript + Express + PostgreSQL + Drizzle ORM)  
**Target Design Identity:** **MODERN INSTITUTIONAL BANKING**  
**Design Standards:** Enterprise Dual-Theme (Light Mode, Dark Mode, System Sync), High Usability, WCAG 2.1 AA Accessibility  
**Date:** November 2026  
**Status:** Approved & In-Progress  

---

## 1. Route Inventory

COREvia provides 32 functional enterprise modules accessible through canonical URL routes with client-side history synchronization and deep linking:

| Route Path | Canonical Module ID | Module Title & Responsibility | Target RBAC Scope |
| :--- | :--- | :--- | :--- |
| `/` or `/dashboard` | `dashboard` | Operations Cockpit & Executive Command Center | All Roles (`dashboard:view`) |
| `/customers` | `customers` | Customer 360, KYC/cKYC Dossier & Risk Rating | Branch Manager, RM, Service Agent, Analyst |
| `/accounts` | `accounts` | CASA & Term Deposits, Ledgers, Liens & Freezes | Branch Manager, RM, Operations, Service Agent |
| `/loans` | `lending` | Lending & Credit Advances, Repayment Schedules | Branch Manager, RM, Credit Analyst |
| `/opportunities` | `opportunities` | Deals & Opportunities Pipeline (Stage Tracking) | Branch Manager, Relationship Manager |
| `/service-desk` | `cases` | Service Cases, Customer Grievances & SLA Hub | Branch Manager, Service Agent, RM |
| `/tasks` | `tasks` | Officer Tasks, Follow-ups & Maker-Checker Workflows | All Internal Officers |
| `/analytics` | `analytics` | Management Intelligence, Profitability & Branch KPIs | Branch Manager, Credit Analyst, Admin |
| `/intelligence` | `intelligence` | Relationship Intelligence Engine (RI-v1 Signals) | Branch Manager, RM, Analyst, Service Agent |
| `/next-best-actions` (`/nba`) | `next-best-actions` | Next Best Actions (NBA) & Rationale Cards | Branch Manager, RM, Analyst, Service Agent |
| `/opportunity-radar` (`/radar`)| `opportunity-radar` | Customer Opportunity Radar (Expansion Triggers) | Branch Manager, RM, Analyst |
| `/relationship-twin` (`/twin`) | `relationship-twin` | Relationship Digital Twin & Simulation State | Branch Manager, RM, Analyst |
| `/relationship-graph` (`/graph`)| `relationship-graph` | SVG Network Intelligence & Entity Relationship Graph | Branch Manager, RM, Analyst, Admin |
| `/strategy-simulator` (`/simulator`) | `strategy-simulator` | Strategy Sandbox & Multi-Scenario What-If Modeling | Branch Manager, RM, Analyst |
| `/agent` (`/banking-agent`) | `agent` | Controlled Banking Agent with Human Confirmation | Branch Manager, RM, Operations, Admin |
| `/journeys` (`/lifecycle`) | `journeys` | Customer Journey Orchestration & Lifecycle Stages | Branch Manager, RM, Operations |
| `/groups` (`/households`) | `groups` | Household & Business Groups 360 (Conglomerates) | Branch Manager, RM, Analyst |
| `/copilot` | `copilot` | Gemini Banking Copilot Workspace | All Authenticated Users |
| `/audit-logs` | `audit-regulatory` | Statutory Audit Trails & Cryptographic Evidence | Branch Manager, Operations, Analyst, Admin |
| `/maker-checker` | `maker-checker` | Maker-Checker Dual-Authorization Queue | Branch Manager, Operations Officer |
| `/products` | `products` | Banking Product Catalog & Pricing Rules | All Roles |
| `/payments` | `payments` | Payments Switch, RTGS/NEFT/IMPS & CTS Clearing | Branch Manager, Operations, Service Agent |
| `/trade-finance` | `trade-finance` | Trade Finance, Letters of Credit & Bank Guarantees | Branch Manager, Operations, RM |
| `/onboarding` | `onboarding` | Digital Onboarding & KYC Application Pipeline | All Onboarding Officers |
| `/interactions` | `interactions` | Customer Interaction Hub & Multichannel History | Branch Manager, RM, Service Agent |
| `/documents` | `documents` | Document Intelligence Vault & OCR Metadata | Branch Manager, RM, Operations, Admin |
| `/governance` | `governance` | Trust & Governance Center (Model Safety & Keys) | Branch Manager, Compliance, Admin |
| `/operations` | `operations` | Banking Operations, Exceptions & Clearing Recon | Branch Manager, Operations Officer |
| `/portfolio-intelligence` | `portfolio-intelligence` | Portfolio Risk, Health Distribution & Concentration | Branch Manager, Analyst, Admin |
| `/integrations` | `integrations` | Enterprise Integration Gateway & Webhook Registry | Branch Manager, Admin |
| `/admin` | `admin` | Enterprise Administration, User Lifecycle & RBAC | System Administrator Only |
| `/showcase` | `showcase` | Platform Architecture & Capability Showcase | All Roles |
| `/login` | `login` | Authentication Portal (Split-Screen Institutional) | Public / Unauthenticated |

---

## 2. Component Inventory

The application frontend comprises **114 component files** and supporting core libraries:

### 2.1 Core Layout & Shell (3 files)
- `src/components/layout/Header.tsx`: Master top bar with breadcrumbs, live clock, search, theme switcher, profile.
- `src/components/layout/Sidebar.tsx`: Multi-tier grouped sidebar with collapse state, active indicator, mobile drawer.
- `src/components/layout/SystemStatusBar.tsx`: Low-latency connection & telemetry status bar.

### 2.2 Reusable Design System Primitives (`src/components/common/`, 21 files)
- `Button.tsx`, `IconButton.tsx`: Multi-variant, accessible interactive buttons.
- `Input.tsx`, `Select.tsx`, `Checkbox.tsx`: Form inputs with explicit label associations and error states.
- `Card.tsx`: Structured container with Header, Content, Footer slots.
- `Badge.tsx`: Status indicator chip with regulatory color schemes.
- `Table.tsx`, `DataTable.tsx`: High-density enterprise tabular registers with sorting and row selection.
- `Tabs.tsx`: WAI-ARIA compliant tab list with keyboard arrow navigation.
- `Modal.tsx`, `Dialog.tsx`: Accessible dialogs with focus trapping and Escape key dismissal.
- `Drawer.tsx`: Multi-size slide-over drawer panel (`left` and `right`).
- `Dropdown.tsx`, `Popover.tsx`, `Tooltip.tsx`: Contextual overlays and action menus.
- `Skeleton.tsx`: Structured loading placeholders preventing CLS.
- `EmptyState.tsx`, `ErrorState.tsx`: Deterministic empty and error recovery containers.
- `Toast.tsx`: Non-intrusive live-region alert system replacing blocking browser popups.
- `AccessRestrictedNotice.tsx`: RBAC access-denial fallback card.
- `tokens.ts`, `index.ts`: Unified design system export barrels.

### 2.3 Domain Workspaces & Modules (32 files in `src/components/modules/`)
- `DashboardModule.tsx`: Executive banking relationship command center.
- `CustomerKYCModule.tsx`: Customer master, 360 dossier, and 19 sub-tabs.
- `AccountsModule.tsx`: CASA ledger, term deposits, and statement inspection.
- `LendingModule.tsx`: Loan accounts, facility schedules, covenants.
- `ProductsModule.tsx`: Deposit, lending, and treasury product catalog.
- `CasesModule.tsx`: Service ticket queue, priority matrix, SLA countdowns.
- `OpportunitiesModule.tsx`: Deal stage pipeline, expected revenue, win probability.
- `TasksModule.tsx`: Action item register and follow-up tracker.
- `RelationshipIntelligenceModule.tsx`: RI-v1 signal queue and score drivers.
- `NextBestActionModule.tsx`: AI recommendation cards and evidence inspection.
- `OpportunityRadarModule.tsx`: Customer propensity radar and opportunity conversion.
- `RelationshipTwinModule.tsx`: Behavioral digital twin and resilience simulation.
- `RelationshipGraphModule.tsx`: Entity topology canvas and path finding.
- `StrategySimulatorModule.tsx`: Interest rate & portfolio scenario sandbox.
- `AgentWorkspaceModule.tsx`: Supervised banking agent with human approval gate.
- `JourneysModule.tsx`: Customer lifecycle milestone tracker.
- `GroupsModule.tsx`: Household and corporate group dossiers.
- `GovernanceModule.tsx`: AI safety, cryptographic audit hash chains, and key security.
- `OperationsModule.tsx`: Exception triage and maker-checker reviews.
- `PortfolioIntelligenceModule.tsx`: Branch portfolio risk & concentration.
- `IntegrationsModule.tsx`: Circuit breakers, webhook logs, HMAC-SHA256 signatures.
- `AdminModule.tsx`: User lifecycle, role permissions, and security events.
- `ShowcaseModule.tsx`: Enterprise capabilities showcase.
- `PaymentsSwitchModule.tsx`, `TradeFinanceModule.tsx`, `MakerCheckerModule.tsx`, `AuditRegulatoryModule.tsx`: Transaction settlement & compliance.
- `CopilotModule.tsx`, `DailyEODReportView.tsx`, `ForexBoard.tsx`, `CrossBorderFxCalculator.tsx`.

### 2.4 Domain Modals, Drawers & Widgets (58 files across subdirectories)
- `components/copilot/`: `CopilotWorkspace.tsx`, `CopilotDrawer.tsx`, `CopilotActionCard.tsx`, `CopilotMessageItem.tsx`.
- `components/onboarding/`: `OnboardingModule.tsx`, `OnboardingDetailDrawer.tsx`, `NewApplicationModal.tsx`, `DocumentReviewModal.tsx`, `RaiseExceptionModal.tsx`, `ResolveExceptionModal.tsx`, `WaiveExceptionModal.tsx`, `ReassignModal.tsx`.
- `components/interactions/`: `InteractionsModule.tsx`, `InteractionDetailDrawer.tsx`, `RecordInteractionModal.tsx`, `CommunicationProfileWidget.tsx`.
- `components/documents/`: `DocumentIntelligenceModule.tsx`, `DocumentDetailDrawer.tsx`, `CustomerDocumentsTab.tsx`, `UploadDocumentModal.tsx`.
- `components/groups/`: `GroupWorkspace.tsx`, `PortfolioGroupsView.tsx`.
- `components/journeys/`: `CustomerJourneyWorkspace.tsx`, `CustomerJourneysTab.tsx`, `PortfolioJourneysView.tsx`.
- `components/admin/`: `AdminWorkspace.tsx`, `AdminConfirmModal.tsx`, `UserDetailDrawer.tsx`, `SecurityEventDetailDrawer.tsx`.
- `components/operations/`: `OperationsWorkspace.tsx`, `ExceptionDetailDrawer.tsx`, `ApprovalReviewModal.tsx`.
- `components/portfolio-intelligence/`: `PortfolioIntelligenceWorkspace.tsx`, `CustomerPortfolioDrawer.tsx`, `MetricInfoModal.tsx`.
- `components/nba/`: `NextBestActionCard.tsx`, `ActionEvidenceModal.tsx`, `CreateTaskModal.tsx`, `DismissActionModal.tsx`, `DailyRelationshipBriefWidget.tsx`.
- `components/radar/`: `CustomerOpportunityRadarWidget.tsx`, `RadarSignalCard.tsx`, `RadarEvidenceModal.tsx`, `ConvertOpportunityModal.tsx`, `DismissRadarModal.tsx`.
- `components/modals/`: `AccountDetailModal.tsx`, `NewTransactionModal.tsx`, `LienMarkModal.tsx`, `TransactionReceiptModal.tsx`, `BiometricAuthModal.tsx`, `InactivityWarningModal.tsx`.
- `components/notifications/`: `NotificationDrawer.tsx`, `NotificationStreamWidget.tsx`, `CustomerAlertsCard.tsx`, `NotificationPreferencesModal.tsx`.
- `components/graph/`: `RelationshipGraph.tsx`.
- `components/governance/`: `TrustGovernanceCenter.tsx`.
- `components/showcase/`: `ShowcaseWorkspace.tsx`.
- `components/dashboard/`: `MarketMovementsWidget.tsx`.
- `components/twin/`: `CustomerTwinTab.tsx`, `CompactRelationshipTwinWidget.tsx`.
- `components/relationship-value/`: `RelationshipValueProfile.tsx`.
- `components/decision-trace/`: `DecisionTracePanel.tsx`, `DecisionComparisonModal.tsx`.
- `components/simulator/`: `ScenarioComparisonModal.tsx`, `ApplyActionConfirmationModal.tsx`.
- `components/integrations/`: `NewWebhookModal.tsx`, `IntegrationDetailDrawer.tsx`, `SimulatorTestModal.tsx`.
- `components/auth/`: `LoginPage.tsx`.

---

## 3. Existing Design Audit

### Strengths:
1. Strong structural foundation with dedicated components and centralized data fetching via `bankingApi`.
2. Responsive touchpoints and established WCAG 2.1 AA focus rings (`outline: 2px solid #087F8C !important`).
3. Clean typography pairing with Inter and IBM Plex Mono for financial values.
4. Elimination of blocking `alert()` popups in favor of `useToast()`.

### Critical Deficiencies to Resolve in this Transformation:
1. **Zero Dark Mode Support**: The application is strictly locked to Light Mode with hardcoded `bg-white`, `bg-[#F5F7FA]`, `bg-slate-50`, and `text-slate-800`. Toggling a dark theme is currently impossible because no theme context, CSS variables, or dark class tree exists.
2. **Outdated Color Identity**: The existing color palette uses `#087F8C` teal and standard Tailwind slate grays, which lack the authoritative prestige of the new **Modern Institutional Banking** palette:
   - Light Mode: Navy `#142C45`, Teal `#168C83`, Muted Gold `#D9A441`, Canvas `#F4F6F8`, Surface `#FFFFFF`, Secondary Surface `#EDF1F5`.
   - Dark Mode: Canvas `#080F19`, Sidebar/Header `#101C2A`, Primary Surface `#162638`, Secondary Surface `#192B3D`, Elevated Surface `#1C3045`, Border `#33485D`.
3. **Login Experience Needs Complete Redesign**: The login page currently uses a single centered card layout with basic inputs. It requires an institutional split-screen banking composition, multi-theme selector, enhanced security credential highlights, and premium visual prestige.
4. **Header & Sidebar Modernization**: The header lacks a theme switcher and streamlined banking controls. The sidebar needs a richer institutional surface hierarchy, refined active indicators with the new teal `#168C83`, and gold accent touches.
5. **Chart Themes are Static**: Recharts components currently hardcode light-mode fill colors, light grid lines (`#E2E8F0`), and white tooltip cards, causing blinding optical contrast when rendered against dark canvases.
6. **Hardcoded Inline Color Styles**: Numerous components use literal hex codes (`#0f1e36`, `#f8fafc`, `#e2e8f0`) directly in JSX rather than semantic CSS variables or theme-aware Tailwind classes.

---

## 4. Existing Functionality Inventory

The application's business and data architecture is rich, realistic, and strictly preserved:
- **Authentication & RBAC**: Real JWT cookie-based session verification with 6 discrete enterprise roles (Admin, BM, RM, Operations, Analyst, Service Agent), inactive/suspended account lockout, and dev credentials helper.
- **Customer 360 & KYC Registry**: Live database records for canonical subjects (e.g. Rahul Sharma `CUS-10482`, `HH-10482`), risk rating overrides, cKYC verification, document attachment.
- **Deposit & Lending Engines**: CASA registers, transaction postings, lien placement, credit advances, facility covenants.
- **Relationship Intelligence (RI-v1)**: Deterministic score modeling (CORE Score 0-1000), churn risk, Next Best Actions with explainable evidence, Opportunity Radar.
- **Digital Twin & Strategy Simulator**: Customer behavioral simulation, interest rate sensitivity, portfolio stress testing.
- **Controlled Banking Agent**: Supervised autonomous banking agent with strict human confirmation maker-checker gate.
- **Trust & Governance**: Cryptographic SHA-256 audit chaining, AI model governance telemetry, and HMAC-SHA256 webhook signatures.
- **Zero Business Logic Regressions**: All calculations, API contracts, RBAC guards, and maker-checker workflows remain 100% intact.

---

## 5. Redesign Implementation Plan

The redesign is executed in controlled, verified stages:

```
[Phase 1: Design Tokens, CSS Engine & Global Theme System]
  ├── Define complete Light & Dark tokens in src/styles/tokens.ts
  ├── Configure Tailwind v4 @theme, semantic variables & @custom-variant dark in src/index.css
  ├── Implement ThemeContext & ThemeProvider in src/context/ThemeContext.tsx
  └── Support 'light', 'dark', and 'system' with persistent localStorage & zero flash

[Phase 2: Common Design System Primitives Re-architecture]
  ├── Upgrade Button, IconButton, Badge, Card, StatCard for dual-theme
  ├── Upgrade Input, Select, Checkbox, Dropdown, Popover, Tooltip for dual-theme
  ├── Upgrade Table, DataTable, Tabs, Modal, Dialog, Drawer for dual-theme
  ├── Upgrade Skeleton, EmptyState, ErrorState, Toast for dual-theme
  └── Ensure ZERO white surfaces in Dark Mode across all primitives

[Phase 3: Login Experience Transformation]
  ├── Redesign LoginPage into an institutional split-screen composition
  ├── Implement theme switcher directly on login screen
  ├── Add credential visibility, validation, caps-lock detector, and dev account selector
  └── Fully style for both Light and Dark modes with responsive mobile layout

[Phase 4: Application Shell & Navigation Modernization]
  ├── Redesign Header with breadcrumbs, global search, clock, city selector, theme switcher
  ├── Redesign Sidebar with new brand colors (#142C45, #168C83, #D9A441), collapse state, and active markers
  ├── Redesign SystemStatusBar with real latency & security telemetry
  └── Ensure seamless mobile navigation drawer with backdrop transitions

[Phase 5: Executive Dashboard Command Center Transformation]
  ├── Redesign DashboardModule with new brand tokens & dual-theme surfaces
  ├── Implement theme-aware Recharts (dynamic grid, axis text, tooltips, gradients)
  ├── Modernize KPI Section, Priority Actions, Pipeline, and Activity feeds
  └── Preserve animated number transitions and real-time sync indicators

[Phase 6: Comprehensive Module-by-Module Redesign]
  ├── Customer Management: Customers 360, Accounts, Lending, Products, Onboarding
  ├── Relationship Intelligence: NBA, Radar, Twin, Graph, Strategy Simulator, Agent
  ├── Operations & Enterprise: Cases, Tasks, Operations, Governance, Admin, Integrations
  └── Intelligence & Overlays: Copilot Drawer & Workspace, Notifications Drawer
  └── Guarantee 100% Dark Mode compliance across every single table, card, drawer, and modal

[Phase 7: End-to-End Testing, QA & Final Documentation]
  ├── Verify all 8 responsive viewports (1440px down to 375px) in both Light & Dark
  ├── Verify accessibility (WCAG AA focus rings, contrast, reduced motion)
  ├── Execute verification commands: typecheck, lint, test, build
  └── Create DESIGN_SYSTEM.md, THEME_SYSTEM.md, COREVIA_REBRANDING_REPORT.md
```

---

*Phase 1 implementation begins immediately.*

