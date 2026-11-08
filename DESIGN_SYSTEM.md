# COREvia Modern Institutional Banking Design System 3.0

**Architecture:** Enterprise Core Banking Platform & Relationship CRM  
**Design Identity:** **MODERN INSTITUTIONAL BANKING**  
**Version:** 3.0.0  
**Theme Modes:** Light Mode, Dark Mode, System Preference  
**Typography:** Inter (Interface) & IBM Plex Mono (Tabular Numbers & Identifiers)  
**Status:** Implemented, Release-Ready & Verified

---

## 1. Product Vision & Design Philosophy

COREvia is engineered for Tier-1 Scheduled Commercial Banks, corporate treasurers, relationship managers, and banking operations executives. The interface prioritizes **high financial density, deterministic state representation, immediate readability, and institutional sophistication**.

### Core Tenets:
1. **Institutional Clarity**: Clean contrast, crisp borders, unambiguous information hierarchy, and strict tabular numeric alignment.
2. **Dual-Theme Parity**: Light Mode and Dark Mode are first-class peers. Dark Mode is genuinely dark with an intentional surface hierarchy—never inverted, and never containing white card or table surfaces.
3. **Desktop Information Density**: Compact vertical metrics (26px - 40px controls), restrained padding (8px - 16px), and high-density data tables designed for 1080p, 1440p, and multi-display trading desks.
4. **Governed Interaction**: Instant deterministic micro-feedback (120ms - 180ms), WCAG 2.1 AA keyboard focus indicators, dual-control maker-checker confirmation gates, and complete absence of decorative gimmicks.

---

## 2. Complete Token System

### 2.1 Brand & Surface Color Tokens

#### Light Mode Palette
| Token | Value | Role |
| :--- | :--- | :--- |
| `primaryNavy` | `#142C45` | Structural header, primary typographic authority, anchor |
| `primaryTeal` | `#168C83` | Interactive brand color, active tabs, focus outlines |
| `brandHover` | `#1B9D92` | Interactive button & link hover state |
| `mutedGold` | `#D9A441` | Executive highlights, category labels, statutory badges |
| `background` | `#F4F6F8` | Canvas background providing soft optical contrast |
| `surface` | `#FFFFFF` | Primary surface for cards, data tables, dialogs |
| `secondarySurface` | `#EDF1F5` | Secondary surface for table headers, filter bars, status bars |
| `elevatedSurface` | `#FFFFFF` | Modals, dropdown menus, context popovers |
| `inputBackground` | `#FFFFFF` | Form text fields, selects, filter dropdowns |
| `dropdownBackground` | `#FFFFFF` | Dropdown menu background |
| `dialogBackground` | `#FFFFFF` | Modal dialog container |
| `drawerBackground` | `#FFFFFF` | Slide-over drawer background |
| `tableBackground` | `#FFFFFF` | Data table canvas |
| `tableHeader` | `#F8FAFC` | Data table header row |
| `tableHover` | `#F1F5F9` | Table row hover highlight |
| `primaryText` | `#273444` | High-contrast body copy and headings |
| `secondaryText` | `#5D6B7B` | Secondary descriptions and form labels |
| `mutedText` | `#8793A1` | Timestamps, metadata, footnotes |
| `border` | `#DCE3EA` | Strong card, table, and input boundaries |
| `subtleBorder` | `#E8EEF4` | Inner section dividers and table row borders |

#### Dark Mode Palette (Strict Zero-White Invariant)
| Token | Value | Role |
| :--- | :--- | :--- |
| `primaryNavy` | `#142C45` | Deep institutional navy brand base |
| `primaryTeal` | `#168C83` | Interactive brand color, active tabs, focus outlines |
| `brandHover` | `#1B9D92` | Interactive button & link hover state |
| `mutedGold` | `#D9A441` | Executive highlights, category labels, statutory badges |
| `background` | `#080F19` | Deep obsidian application background |
| `sidebar` | `#101C2A` | Midnight navigation rail |
| `header` | `#101C2A` | Unified midnight command bar |
| `surface` | `#162638` | Deep navy primary cards, data tables, dialogs |
| `secondarySurface` | `#192B3D` | Elevated card wells, stat card insets, secondary bars |
| `elevatedSurface` | `#1C3045` | Modals, dropdown menus, context popovers |
| `inputBackground` | `#101C2A` | Deep input and textarea wells |
| `dropdownBackground` | `#162638` | Dropdown menu background |
| `dialogBackground` | `#162638` | Modal dialog container |
| `drawerBackground` | `#162638` | Slide-over drawer background |
| `tableBackground` | `#162638` | Data table canvas |
| `tableHeader` | `#101C2A` | Distinct table header row |
| `tableHover` | `#20364B` | Table row hover highlight |
| `primaryText` | `#E8EEF5` | High-contrast crisp white-slate headings |
| `secondaryText` | `#A9BACB` | Cool silver body text and secondary labels |
| `mutedText` | `#8194A8` | Muted timestamps, codes, and captions |
| `border` | `#33485D` | Strong card, table, and input boundaries |
| `subtleBorder` | `#26394C` | Inner section dividers and grid lines |

---

### 2.2 Semantic Status Colors

| Semantic State | Light Mode Text | Light Surface / Border | Dark Mode Text | Dark Surface / Border |
| :--- | :--- | :--- | :--- | :--- |
| **Success** | `#16803C` | `#F0FDF4` / `#BBF7D0` | `#22C55E` | `#062814` / `#15803D` |
| **Warning** | `#B7791F` | `#FEFCE8` / `#FEF08A` | `#F59E0B` | `#341A04` / `#B45309` |
| **Danger** | `#B42318` | `#FEF2F2` / `#FECACA` | `#EF4444` | `#370B0B` / `#B91C1C` |
| **Info** | `#2563EB` | `#EFF6FF` / `#BFDBFE` | `#3B82F6` | `#0D203F` / `#1D4ED8` |

---

### 2.3 Typography Scale

Only two fonts are permitted in COREvia:
1. **Inter**: Interface navigation, headings, body copy, form fields, buttons, tables, dialogs.
2. **IBM Plex Mono**: Financial identifiers (CUS/CIF, Account Numbers, PAN, UTRs, Case IDs), monetary balances (`tabular-nums`), and timestamps.

| Token | Size | Line Height | Weight | Application |
| :--- | :---: | :---: | :---: | :--- |
| `text-2xs` | 10px | 14px | 500 / 600 | Regulatory code badges, UTR references, SLA flags |
| `text-xs` | 12px | 16px | 400 / 500 / 600 | Primary table cells, form labels, secondary descriptions |
| `text-sm` | 13px | 18px | 500 / 600 | Card headers, modal text, button labels |
| `text-base` | 14px | 20px | 400 / 500 | Standard body copy |
| `text-md` | 15px | 22px | 600 | Metric cards, section titles |
| `text-lg` | 16px | 24px | 600 / 700 | Primary cockpit KPIs, drawer title |
| `text-xl` | 18px | 26px | 700 | Executive headers, module names |
| `text-2xl` | 20px | 28px | 700 | Financial summary headers |
| `text-3xl` | 24px | 32px | 700 | Executive hero figures |

---

### 2.4 Spacing Scale

High desktop information density is maintained with compact rem/pixel ratios:

| Token | Pixels | Usage |
| :--- | :---: | :--- |
| `spacing[0.5]` | 2px | Micro element gaps, indicator offsets |
| `spacing[1]` | 4px | Icon padding, compact button spacing |
| `spacing[1.5]` | 6px | Tight badges, chip gaps |
| `spacing[2]` | 8px | Standard input padding Y, table compact cell padding |
| `spacing[2.5]` | 10px | Table cell padding Y (standard) |
| `spacing[3]` | 12px | Card header padding Y, modal inset |
| `spacing[3.5]` | 14px | Stat card padding |
| `spacing[4]` | 16px | Standard card body padding, module container margins |
| `spacing[5]` | 20px | Dialog padding |
| `spacing[6]` | 24px | Module section vertical rhythm |
| `spacing[8]` | 32px | Large view gaps |
| `spacing[10]` | 40px | Workspace canvas margins |
| `spacing[12]` | 48px | Empty state padding |

---

### 2.5 Border Radius Scale

Restrained border radii prevent the playful, casual SaaS aesthetic:

| Token | Value | Applied To |
| :--- | :---: | :--- |
| `radii.none` | 0px | Tables, flush headers |
| `radii.xs` | 2px | Badges, micro tags, tooltips, keyboard `<kbd>` tags |
| `radii.sm` | 4px | Buttons, inputs, selects, cards, dropdowns |
| `radii.md` | 6px | Modals, stat cards, metric wells |
| `radii.lg` | 8px | Slide-over drawers, dialog containers |
| `radii.xl` | 12px | Hero panels |
| `radii.full` | 9999px | Status indicator dots, user avatars |

---

### 2.6 Shadows Scale

| Token | CSS Definition | Purpose |
| :--- | :--- | :--- |
| `shadows.none` | `none` | Flat card and table borders |
| `shadows['2xs']` | `0 1px 2px 0 rgba(15, 23, 42, 0.04)` | Subtle button and input depth |
| `shadows.xs` | `0 1px 2px 0 rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.03)` | Card elevation 1 |
| `shadows.sm` | `0 2px 4px -1px rgba(15, 23, 42, 0.06), 0 4px 6px -1px rgba(15, 23, 42, 0.04)` | Dropdown menus, popovers |
| `shadows.md` | `0 4px 6px -2px rgba(15, 23, 42, 0.05), 0 10px 15px -3px rgba(15, 23, 42, 0.07)` | Floating drawers, dialogs |
| `shadows.lg` | `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 20px 25px -5px rgba(15, 23, 42, 0.1)` | Top-level modal overlays |

---

### 2.7 Elevation Hierarchy

| Level | Shadow | Light Surface | Dark Surface | Typical Component |
| :--- | :--- | :--- | :--- | :--- |
| **Level 0** | `none` | `#F4F6F8` | `#080F19` | Application canvas |
| **Level 1** | `2xs` | `#FFFFFF` | `#162638` | Standard cards, data tables |
| **Level 2** | `xs` | `#FFFFFF` | `#192B3D` | Active / focused cards, secondary wells |
| **Level 3** | `sm` | `#FFFFFF` | `#1C3045` | Dropdown menus, context popovers |
| **Level 4** | `md` | `#FFFFFF` | `#1C3045` | Slide-over drawers, action sheets |
| **Level 5** | `lg` | `#FFFFFF` | `#1C3045` | Centered modal dialogs |

---

### 2.8 Component Dimensions

| Component | Size Variant | Height / Width | Padding / Typography |
| :--- | :--- | :--- | :--- |
| **Button** | `xs` | 26px | 8px X, 11px font |
| | `sm` | 32px | 12px X, 12px font |
| | `md` | 36px | 16px X, 13px font |
| | `lg` | 40px | 20px X, 14px font |
| **Input** | `sm` | 28px | 12px font |
| | `md` | 34px | 13px font |
| **Table Row** | `compact` | 32px | High-density ledger mode |
| | `default` | 40px | Standard data tables |
| | `relaxed` | 48px | Rich customer 360 rows |
| **Navigation** | `sidebarExpanded` | 240px | Standard aside rail |
| | `sidebarCollapsed` | 64px | Icon-only collapsed rail |
| | `headerTier1` | 42px | Executive command bar |
| | `headerTier2` | 40px | Secondary navigation bar |
| | `systemStatusBar` | 24px | CBS Online footer |
| **Drawer** | `sm` / `md` / `lg` / `xl` | 380px / 480px / 560px / 680px | Right slide-over panels |
| **Dialog** | `sm` / `md` / `lg` / `xl` | 400px / 540px / 720px / 900px | Centered modal windows |

---

### 2.9 Responsive Breakpoints

| Breakpoint | Minimum Width | Intended Target |
| :--- | :---: | :--- |
| `sm` | 640px | Large phones in landscape |
| `md` | 768px | Tablets (iPad mini / 9.7") |
| `lg` | 1024px | Tablets landscape / Small laptops |
| `xl` | 1280px | Standard desktop displays (1080p scale) |
| `2xl` | 1536px | Wide banking terminals & 1440p+ trading monitors |

---

### 2.10 Focus, Hover & Active States

- **Keyboard Focus (WCAG 2.1 AA)**:
  `outline-none focus-visible:ring-2 focus-visible:ring-[#168C83] focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#162638]`
- **Interactive Hover**:
  `transition-colors duration-150 ease-out hover:border-[#168C83] hover:bg-[#EDF1F5] dark:hover:bg-[#20364B]`
- **Active / Pressed**:
  `active:scale-[0.98] transition-transform duration-75`

---

## 3. Reusable Component Inventory

All components are centralized in `src/components/common/` with barrel exports from `src/components/common/index.ts`:

1. **[`Button`](file:///Users/aditya/Downloads/corevia-core-banking/src/components/common/Button.tsx)**:
   - Variants: `primary`, `secondary`, `outline`, `ghost`, `danger`, `brand`.
   - Sizes: `xs` (26px), `sm` (32px), `md` (36px), `lg` (40px).
   - Features: Built-in loading spinner, icon left/right slots, keyboard focus ring.
2. **[`IconButton`](file:///Users/aditya/Downloads/corevia-core-banking/src/components/common/IconButton.tsx)**:
   - Accessible icon-only button with tooltip integration and ARIA label enforcement.
3. **[`Input`](file:///Users/aditya/Downloads/corevia-core-banking/src/components/common/Input.tsx) & [`Textarea`](file:///Users/aditya/Downloads/corevia-core-banking/src/components/common/Input.tsx)**:
   - Inputs with label, helper text, inline validation error, prefix icon, suffix action slot, and mono format option.
   - Textarea with auto-rows, institutional borders, and resize control.
4. **[`Select`](file:///Users/aditya/Downloads/corevia-core-banking/src/components/common/Select.tsx)**:
   - Form select dropdown with dark option styling and keyboard navigation.
5. **[`Checkbox`](file:///Users/aditya/Downloads/corevia-core-banking/src/components/common/Checkbox.tsx)**:
   - Custom check with dual-control highlight and keyboard focus.
6. **[`DataTable`](file:///Users/aditya/Downloads/corevia-core-banking/src/components/common/DataTable.tsx)**:
   - Enterprise data table with column sorting, filtering, selection, and integrated pagination.
7. **[`Pagination`](file:///Users/aditya/Downloads/corevia-core-banking/src/components/common/Pagination.tsx)**:
   - Dedicated pagination controller with first, prev, next, last, page number ellipsis, and per-page size selector.
8. **[`Badge`](file:///Users/aditya/Downloads/corevia-core-banking/src/components/common/Badge.tsx)**:
   - Semantic badge with variants: `default`, `brand`, `success`, `warning`, `danger`, `info`.
9. **[`Card`](file:///Users/aditya/Downloads/corevia-core-banking/src/components/common/Card.tsx)**:
   - Surface container with title, subtitle, action header slot, footer, and sunken card wells.
10. **[`StatCard`](file:///Users/aditya/Downloads/corevia-core-banking/src/components/common/StatCard.tsx)**:
    - High-density KPI indicator with sparkline trend charts, change percentage, and statutory annotations.
11. **[`Tabs`](file:///Users/aditya/Downloads/corevia-core-banking/src/components/common/Tabs.tsx)**:
    - Navigation tabs with `line` (active teal underline) and `pill` variants.
12. **[`Dropdown`](file:///Users/aditya/Downloads/corevia-core-banking/src/components/common/Dropdown.tsx)**:
    - Accessible floating menu overlay with keyboard arrow navigation.
13. **[`Tooltip`](file:///Users/aditya/Downloads/corevia-core-banking/src/components/common/Tooltip.tsx)**:
    - Non-blocking contextual label with auto-positioning.
14. **[`Drawer`](file:///Users/aditya/Downloads/corevia-core-banking/src/components/common/Drawer.tsx)**:
    - Slide-over panel (right/left) with smooth physics and backdrop click handling.
15. **[`Dialog`](file:///Users/aditya/Downloads/corevia-core-banking/src/components/common/Dialog.tsx) (and `Modal`)**:
    - Centered dialog with focus trap, backdrop dismissal, ESC key handling, and dark surface support.
16. **[`Toast`](file:///Users/aditya/Downloads/corevia-core-banking/src/components/common/Toast.tsx)**:
    - Toast stack provider (`useToast()`) with success, error, warning, and info dispatchers.
17. **[`NotificationBanner`](file:///Users/aditya/Downloads/corevia-core-banking/src/components/common/Notification.tsx) & [`NotificationBadge`](file:///Users/aditya/Downloads/corevia-core-banking/src/components/common/Notification.tsx)**:
    - In-page alert banners and unread count badges with pulse indicators.
18. **[`ThemeSwitcher`](file:///Users/aditya/Downloads/corevia-core-banking/src/components/common/ThemeSwitcher.tsx)**:
    - 3-mode theme switcher (`light`, `dark`, `system`) with `compact`, `segmented`, and `dropdown` presentations.
