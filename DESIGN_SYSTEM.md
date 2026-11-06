# COREvia Institutional Design System 2.0

**Architecture:** Enterprise Core Banking Platform  
**Design Philosophy:** **INSTITUTIONAL CLARITY + PREMIUM INTERACTION**  
**Version:** 2.0.0  
**Status:** Implemented & Verified

---

## 1. Design Philosophy: Institutional Clarity + Premium Interaction

COREvia is engineered for Tier-1 Scheduled Commercial Banks, corporate treasurers, relationship managers, and regulatory compliance officers. The interface prioritizes **high information density, deterministic state representation, immediate readability, and zero decorative distraction**.

### Core Tenets:
1. **Institutional Clarity**: Crisp borders, unambiguous hierarchies, semantic color discipline, and tabular alignment for financial precision.
2. **Premium Interaction**: Responsive micro-feedback (100ms-150ms transitions), accessible keyboard navigation (Tab, Arrow keys, Escape, Enter), and governed in-app toast feedback instead of blocking browser popups.
3. **Desktop Information Density**: Compact vertical metrics (28px - 34px inputs/buttons), restrained padding (8px - 16px), and high-density data tables designed for 1080p and 1440p banking terminals.
4. **Anti-Patterns Strictly Avoided**:
   - ❌ No glassmorphism or backdrop blurs that degrade legibility
   - ❌ No neon or dark sci-fi color palettes
   - ❌ No excessive diagonal gradients
   - ❌ No oversized typography or mobile-first whitespace bloat
   - ❌ No giant rounded corners (maximum 8px for dialogs, 4px for inputs/cards)
   - ❌ No decorative AI glowing or pulsating effects

---

## 2. Design Tokens Specification

### 2.1 Color Palette

```
Brand (Teal Primary):    #087F8C   rgb(8, 127, 140)
Canvas Background:       #F5F7FA   rgb(245, 247, 250)
Primary Surface:         #FFFFFF   rgb(255, 255, 255)
Secondary Surface:       #F8FAFC   rgb(248, 250, 252)
Sunken Surface:          #F1F5F9   rgb(241, 245, 249)

Subtle Border:           #E2E8F0   rgb(226, 232, 240)
Strong Border:           #CBD5E1   rgb(203, 213, 225)
Interactive Border:      #94A3B8   rgb(148, 163, 184)

Primary Text:            #172033   rgb(23, 32, 51)
Secondary Text:          #475569   rgb(71, 85, 105)
Muted Text:              #64748B   rgb(100, 116, 139)

Success (Forest Green):  #16803C   rgb(22, 128, 60)
Warning (Amber Bronze):  #B45309   rgb(180, 83, 9)
Danger (Crimson Red):    #B42318   rgb(180, 35, 24)
Info (Institutional):    #2563EB   rgb(37, 99, 235)

Terminal Navy:           #0f1e36   rgb(15, 30, 54)
```

#### Color Application Rules:
- **Brand `#087F8C`**: Active tab indicators, primary focus rings, selected table rows, brand badges, and verified state accents.
- **Background `#F5F7FA`**: Master workplace background providing soft optical contrast against white surface cards.
- **Surface `#FFFFFF`**: Content panels, cards, data tables, dialogs, and drawer canvases.
- **Secondary Surface `#F8FAFC`**: Table header bars, modal headers/footers, and subtle widget containers.
- **Border Strong `#CBD5E1`**: Card boundaries, input outlines, table frames, and modal perimeters.
- **Status Colors**: Reserved strictly for regulatory and operational states (e.g. KYC verified, SLA breach, held voucher).

### 2.2 Typography Scale

- **Interface Font**: `Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  - Font features enabled: `"cv02", "cv03", "cv04", "cv11"`
- **Financial & Identifier Font**: `IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
  - Tabular figures enforced: `font-variant-numeric: tabular-nums`

| Token | Font Size | Line Height | Weight | Typical Application |
| :--- | :---: | :---: | :---: | :--- |
| `text-2xs` | 10px | 14px | 500 / 600 | Regulatory code badges, UTR references, micro metadata |
| `text-xs` | 12px | 16px | 400 / 500 / 600 | Primary table text, body labels, toolbar controls |
| `text-sm` | 13px / 14px | 18px / 20px | 500 / 600 | Card titles, modal body, lead descriptions |
| `text-base` | 15px | 22px | 600 | Financial balance callouts, key section headers |
| `text-lg` | 16px / 18px | 24px | 700 | Primary metric values, drawer headers |
| `text-xl` | 20px | 28px | 700 | Module titles, cockpit executive figures |
| `text-2xl` | 24px | 32px | 700 | High-value aggregate totals |

### 2.3 Spacing Scale (High Desktop Density)

| Token | Measurement | Typical Use |
| :--- | :---: | :--- |
| `space-0.5` | 2px | Micro gaps, status dot offsets |
| `space-1` | 4px | Icon-text spacing, tight badge padding |
| `space-1.5` | 6px | Button vertical padding (compact), chip spacing |
| `space-2` | 8px | Grid gap (compact), table cell vertical padding |
| `space-2.5` | 10px | Button horizontal padding, input padding |
| `space-3` | 12px | Card internal padding (compact), toolbar gaps |
| `space-3.5` | 14px | Table cell horizontal padding |
| `space-4` | 16px | Standard card padding, module layout spacing |
| `space-5` | 20px | Modal padding, major section margins |
| `space-6` | 24px | Cockpit grid gaps, workspace page margins |

### 2.4 Border Radii

- `rounded-xs` (2px): Micro badges, mono chips, checkbox boxes
- `rounded-sm` (4px): Primary inputs, select boxes, buttons, table containers, cards
- `rounded` / `rounded-md` (6px): Dropdown menus, popovers, notification toasts
- `rounded-lg` (8px): Dialog windows, slide-over drawer containers
- `rounded-full` (9999px): Status indicator dots, circular icon buttons
- *Oversized radii (`rounded-2xl`, `rounded-3xl`) are forbidden in enterprise density.*

### 2.5 Shadows & Elevation

- `shadow-none`: Flat embedded containers, table rows
- `shadow-2xs`: `0 1px 2px 0 rgba(15, 23, 42, 0.04)` (Cards, StatCards, tables)
- `shadow-xs`: `0 1px 2px 0 rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.03)` (Buttons, pill badges)
- `shadow-sm`: `0 2px 4px -1px rgba(15, 23, 42, 0.06)` (Popovers, dropdown menus)
- `shadow-md`: `0 4px 6px -2px rgba(15, 23, 42, 0.05), 0 10px 15px -3px rgba(15, 23, 42, 0.07)` (Dialog windows)
- `shadow-lg` / `shadow-2xl`: `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 20px 25px -5px rgba(15, 23, 42, 0.1)` (Slide-over Drawers)

### 2.6 Focus States & Accessibility (WCAG 2.1 AA)

All interactive elements implement an explicit, high-visibility focus indicator:
```css
outline: 2px solid #087F8C;
outline-offset: 1px;
```
Tailwind utility: `outline-none focus-visible:ring-2 focus-visible:ring-[#087F8C] focus-visible:ring-offset-1 focus-visible:ring-offset-white`

### 2.7 Z-Index Layers

```ts
export const zIndex = {
  auto: 'auto',
  base: 0,
  elevated: 10,
  sticky: 20,
  header: 30,
  navigation: 40,
  dropdown: 50,
  popover: 50,
  drawer: 60,
  modal: 70,
  toast: 80,
  tooltip: 90,
} as const;
```

---

## 3. Reusable Component Catalog

All components are located in `src/components/common/` and exported via `src/components/common/index.ts`.

### 3.1 Button & IconButton
- **Variants**: `'primary'` (navy), `'brand'` (#087F8C), `'secondary'` (light surface), `'outline'` (bordered), `'danger'` (crimson), `'success'` (forest green), `'ghost'`
- **Sizes**: `'xs'` (24px h), `'sm'` (28px h), `'md'` (32px h), `'lg'` (36px h)
- **States Supported**: `default`, `hover`, `active`, `focus-visible`, `disabled`, `loading` (accessible spinner with `aria-busy="true"`)
- **IconButton**: Dedicated accessible square button enforcing mandatory `'aria-label'` for screen readers.

### 3.2 Form Primitives: Input, Select, Checkbox
- **Input**: Supports `label`, `helperText`, `error` (`aria-invalid="true"` and `aria-describedby`), `leftIcon`, `rightElement`, `isMono` (tabular numerals for financial figures/IFSC/PAN), and auto-linked `<label htmlFor>`.
- **Select**: Institutional select with custom SVG chevron, error state, and option array support.
- **Checkbox**: Accessible checkbox supporting `checked`, `indeterminate`, `disabled`, and keyboard focus with brand teal checked state.

### 3.3 Badge & Status Chips
- **Variants**: `'neutral'`, `'success'`, `'warning'`, `'danger'`, `'primary'`, `'brand'`, `'info'`, `'outline'`
- **Sizes**: `'xs'` (10px), `'sm'` (11px), `'md'` (12px)
- **Features**: `dot?: boolean` for status indicators, `icon?: React.ReactNode`, and `interactive?: boolean` for click filters.

### 3.4 Tooltip & Popover
- **Tooltip**: Hover & keyboard focus accessible tooltip with `role="tooltip"`, 150ms delay, and 4 position variants (`top`, `bottom`, `left`, `right`).
- **Popover**: Contextual overlay for filters and action clusters with click-outside and escape-key dismissal.

### 3.5 Tabs
- **WAI-ARIA Tabs Implementation**: `role="tablist"` on container, `role="tab"` on buttons, `aria-selected` boolean, and full keyboard navigation (ArrowRight, ArrowLeft, Home, End).
- **Variants**: `'line'` (bottom border with `#087F8C` active indicator) and `'pill'` (compact segmented button).

### 3.6 Card, CardHeader, CardContent, CardFooter
- High-density card container with crisp `#CBD5E1` border, subtle `shadow-2xs`, and modular header/content/footer slots.
- Eliminates inconsistent ad-hoc padding across dashboard modules.

### 3.7 DataTable (and Table)
- Institutional data register supporting:
  - Column sorting with ascending/descending chevron feedback
  - Keyboard row selection (`tabIndex={0}`, Enter/Space activation, `role="button"`, `aria-selected`)
  - Integrated skeleton row loading (eliminating layout shift)
  - Accessible empty state display
  - Monospace tabular figures for financial columns
  - Density toggle (`'compact'` | `'normal'`)
- Fully backward-compatible with existing `<Table />` imports.

### 3.8 Dialog & Modal
- Replaces legacy modals with accessible dialog windows:
  - `role="dialog"` and `aria-modal="true"`
  - Keyboard focus trapping inside dialog (Tab / Shift+Tab)
  - Focus return to triggering element upon dismissal
  - Escape key and backdrop click listeners
  - Backward-compatible prop support for both `maxWidth` and `size` (`'sm'` through `'full'`).

### 3.9 Drawer
- Universal accessible slide-over panel replacing 10 disparate drawer implementations:
  - Positions: `'right'` | `'left'`
  - Sizes: `'sm'` (380px), `'md'` (480px), `'lg'` (580px), `'xl'` (720px), `'2xl'` (880px), `'full'`
  - Focus trap, focus return, and responsive viewport clamping (`max-w-[100vw] sm:max-w-[85vw]`).

### 3.10 Dropdown
- Action menu with `role="menu"`, `role="menuitem"`, divider support, danger action highlights, and keyboard navigation.

### 3.11 Skeleton
- Structured loading placeholders (`Skeleton`, `SkeletonText`, `SkeletonCard`) preventing Cumulative Layout Shift (CLS).

### 3.12 EmptyState & ErrorState
- **EmptyState**: Standardized placeholder with icon, title, description, and primary CTA.
- **ErrorState**: Replaces raw red text or unhandled exceptions with an alert card featuring code badges and a "Retry Request" action.

### 3.13 Toast Notification System
- Replaces **42 blocking browser `alert()` and `confirm()` calls**:
  - `useToast()` hook with `toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()`
  - Fixed non-intrusive container (`zIndex: 80`) with auto-dismiss timers and manual close controls.

---

## 4. State Matrix Reference

| Component | Default | Hover | Active | Focus-Visible | Disabled | Loading | Error |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Button** | Solid surface / border | Lighten / darken 5% | Scale 0.99 / darken 10% | 2px #087F8C ring | 50% opacity, no-cursor | Spinner, aria-busy | — |
| **IconButton** | Transparent / subtle | Surface tint #F1F5F9 | Darken surface #E2E8F0 | 2px #087F8C ring | 50% opacity, no-cursor | Spinner, aria-busy | — |
| **Input** | Border #CBD5E1, bg white | Border #94A3B8 | — | Border #087F8C, 2px ring | Bg #F1F5F9, text muted | — | Border #B42318, red ring |
| **Select** | Border #CBD5E1, bg white | Border #94A3B8 | — | Border #087F8C, 2px ring | Bg #F1F5F9, text muted | — | Border #B42318, red ring |
| **Checkbox** | Border #CBD5E1, bg white | Border #087F8C | — | 2px #087F8C ring | Opacity 60%, no-cursor | — | Border #B42318 |
| **DataTable Row** | White / alternating #F8FAFC | Bg #F1F5F9 | Border-l-2 #087F8C | 2px #087F8C ring | — | Skeleton pulse rows | Empty error state |
| **Tabs Item** | Text #64748B | Text #172033 | Text #066974, border #087F8C | 2px #087F8C ring | Opacity 50%, no-cursor | — | — |
| **Dialog / Drawer** | Clean white surface | — | — | Focus trapped inside | — | Skeleton inside | ErrorState inside |
| **Toast** | White card, border-l-4 | Hover shadow-xl | — | Focus-visible ring | — | — | Crimson border & icon |

---

## 5. Verification & Compliance Checklist

- [x] Primary brand `#087F8C` established across CSS theme and TypeScript tokens
- [x] All 13 phantom `brand-*` classes resolved and generating native CSS
- [x] Zero application business logic modified
- [x] Zero breaking changes to existing `Button`, `Modal`, `Table`, `Badge`, `Tabs`, `StatCard` API contracts
- [x] Full TypeScript typecheck verification (`npm run lint` exited code 0)
- [x] Full production build verification (`npx vite build` exited code 0)
- [x] `DESIGN_SYSTEM.md` created as single source of truth

---

*COREvia Design System 2.0 is fully operational.*

