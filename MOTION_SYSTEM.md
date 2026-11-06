# COREvia Institutional Motion Engine (Motion 2.0)

**Architecture:** Tier-1 Enterprise Core Banking Platform  
**Design Philosophy:** **INSTITUTIONAL CLARITY + DETERMINISTIC PHYSICS**  
**Version:** 2.0.0  
**Implementation Source:** `src/lib/motion.ts`  
**CSS Engine:** `src/index.css`  
**Status:** Implemented, Bundled & Verified  

---

## 1. Design Philosophy: Institutional Clarity + Deterministic Physics

In high-stakes corporate banking, treasury operations, and statutory compliance, motion must never serve as decorative amusement. Every animation in COREvia communicates an **operational interaction, a spatial hierarchy transition, or an explicit state change**.

### Core Tenets:
1. **Purposeful & Informative**: Motion communicates origin (e.g. lateral drawer sliding from right, dialog lifting from backdrop) and confirms action completion (subtle button tap, toast glide).
2. **Deterministic Physics**: Snappy deceleration curves that enter swiftly and settle smoothly, eliminating floatiness or bouncy rubber-banding.
3. **GPU-Composited Exclusivity**: Animations strictly target `transform` (matrix translation and restrained scale) and `opacity`. The engine never animates `width`, `height`, `margin`, `padding`, `top`, `bottom`, `left`, or `right`, ensuring **Cumulative Layout Shift (CLS) = 0**.
4. **Universal Accessibility (WCAG 2.1 AA)**: Strict automatic compliance with `prefers-reduced-motion` at the global stylesheet layer and via the `usePrefersReducedMotion()` React hook.
5. **Memory Safety & Resource Cleanup**: Event listeners for media queries and window resize listeners are strictly cleaned up on unmount to eliminate memory leaks.

### Anti-Patterns Strictly Forbidden:
- ❌ **No infinite decorative animations**: No floating badges, wandering background shapes, or breathing cards.
- ❌ **No bouncy springs / elastic overshoot**: Physics are strictly institutional and critically damped.
- ❌ **No flashing or strobe effects**: Skeletons use subtle opacity shifts (`0.55` to `1.0`) over 1.8s.
- ❌ **No extreme scale transitions**: Scale ranges are capped between `0.98` and `1.0` (no 0.5 ballooning).
- ❌ **No layout-shifting animations**: No accordion reflows or dynamic height stretching during data loads.
- ❌ **No excessive simultaneous animations**: Staggered or clustered animations that distract operators are prohibited.

---

## 2. Motion Tokens Specification

### 2.1 Duration Scale

Durations are calibrated to cognitive perception thresholds for professional desktop operators:

| Token | Milliseconds | Seconds | Application Scope |
| :--- | :---: | :---: | :--- |
| **Micro** | `120ms` | `0.12s` | Button taps (`active:scale-[0.98]`), checkbox checks, hover tints, micro-badges, focus rings |
| **Standard** | `180ms` | `0.18s` | Dropdown menus, tooltips, dialog window entrances, notifications toasts |
| **Panel** | `240ms` | `0.24s` | Lateral slide-over drawers, mobile navigation sidebars, command center surfaces |
| **Page** | `200ms` | `0.20s` | Core workplace module crossfades, route changes, full-screen view transitions |
| **Visualization** | `300ms` | `0.30s` | SVG relationship graphs, financial charts, yield curves, KPI counter recalculations |

### 2.2 Easing Curves

```ts
export const motionEasing = {
  /** Snappy response with smooth, crisp settling */
  standard: [0.2, 0.0, 0, 1.0],
  standardCss: 'cubic-bezier(0.2, 0.0, 0, 1.0)',

  /** Decelerate (Enter): rapid entrance that glides naturally into resting position */
  decelerate: [0.0, 0.0, 0.2, 1.0],
  decelerateCss: 'cubic-bezier(0.0, 0.0, 0.2, 1.0)',

  /** Accelerate (Exit): swift, purposeful departure */
  accelerate: [0.4, 0.0, 1.0, 1.0],
  accelerateCss: 'cubic-bezier(0.4, 0.0, 1.0, 1.0)',

  /** Linear: constant rate for deterministic progress and indeterminate loaders */
  linear: [0, 0, 1, 1],
  linearCss: 'linear',

  /** Emphasized: slightly deeper curve for modal dialogs and critical alerts */
  emphasized: [0.2, 0.0, 0.1, 1.0],
  emphasizedCss: 'cubic-bezier(0.2, 0.0, 0.1, 1.0)',
} as const;
```

---

## 3. Reusable Transitions Catalog

All transitions are exported from `src/lib/motion.ts` and re-exported via `src/components/common/index.ts`:

### 3.1 Interaction Transitions
- **`hover`**: `120ms decelerate` — provides instant feedback when cursor engages interactive controls.
- **`pressed`**: `120ms standard` — micro-compression (`scale: 0.98`) simulating mechanical key-switch feedback.
- **`focus`**: `120ms standard` — crisp outline stroke rendering (`#087F8C` ring with 1px offset).

### 3.2 Overlay & Surface Transitions
- **`dropdown entrance`**: `120ms decelerate` — subtle 4px vertical drop (`y: -4 -> 0`) paired with `scale: 0.98 -> 1` and opacity crossfade.
- **`drawer entrance`**: `240ms decelerate` — lateral slide along the X-axis (`x: 100% -> 0` for right, `-100% -> 0` for left) with GPU compositing.
- **`dialog entrance`**: `180ms decelerate` — subtle 6px vertical rise (`y: 6 -> 0`) and `scale: 0.98 -> 1` over a fading backdrop curtain.
- **`tab changes`**: `120ms standard` — immediate indicator color shift and subtle 3px content crossfade.
- **`page navigation`**: `200ms standard` — crossfade view entrance (`opacity: 0 -> 1`, `y: 4 -> 0`) applied cleanly to the workplace workspace container.
- **`loading states`**: `850ms linear` — rotational spinner or `1800ms` restrained opacity pulse (`0.55` to `1.0`), replacing aggressive flashing.

---

## 4. Accessibility: Prefers-Reduced-Motion Support

COREvia guarantees complete accessibility for operators with vestibular disorders or motion sensitivity across two complementary layers:

### Layer 1: Global CSS Hard Override (`src/index.css`)
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
This forces all animations, keyframes, transitions, and scroll animations to resolve instantaneously (0.01ms) when the operating system has "Reduce motion" enabled.

### Layer 2: Programmatic React Hook & Motion Config (`src/lib/motion.ts`)
```tsx
import { usePrefersReducedMotion, getReducedVariants } from '../lib/motion';

function ComplianceWidget() {
  const isReduced = usePrefersReducedMotion();
  const safeVariants = getReducedVariants(dialogVariants, isReduced);

  return <motion.div variants={safeVariants} ... />;
}
```
`getReducedVariants` dynamically strips spatial transformations (`x`, `y`, `scale`), delivering a clean instant opacity transition without layout shift.

### Layer 3: Enterprise `<MotionProvider>`
Integrated into the root provider tree (`src/App.tsx`), enabling global user preference overrides (e.g. from Governance / Accessibility preferences) backed by `localStorage`.

---

## 5. Component Motion Matrix

| Component | Trigger | Transition Type | Duration | Easing | Properties Animated |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **`Button` / `IconButton`** | Active Click | Micro Press | `120ms` | `standard` | `transform: scale(0.98)` |
| **`Dialog` Backdrop** | Modal Open | Curtain Fade | `180ms` | `standard` | `opacity: 0 -> 1` |
| **`Dialog` Window** | Modal Open | Decelerated Lift | `180ms` | `decelerate` | `opacity, transform: translateY, scale` |
| **`Drawer` Panel (Right)** | Slide Open | Lateral Slide | `240ms` | `decelerate` | `transform: translateX(100% -> 0)` |
| **`Drawer` Panel (Left)** | Mobile Menu | Lateral Slide | `240ms` | `decelerate` | `transform: translateX(-100% -> 0)` |
| **`Dropdown` Menu** | Trigger Click | Micro Dropdown | `120ms` | `decelerate` | `opacity, transform: translateY(-4px -> 0)` |
| **`Toast` Container** | Alert Trigger | Notification Glide | `180ms` | `decelerate` | `opacity, transform: translateY(10px -> 0)` |
| **`Toast` Dismissal** | Auto/Manual | Notification Exit | `120ms` | `accelerate` | `opacity, transform: translateY(0 -> 6px)` |
| **`Skeleton`** | Loading | Subtle Pulse | `1800ms` | `standard` | `opacity: 1 -> 0.55 -> 1` |
| **Workplace Module** | Nav Switch | Module Crossfade | `200ms` | `standard` | `opacity: 0 -> 1` |

---

## 6. Verification & Performance Diagnostics

1. **GPU Compositing Verification**:
   - All animated properties utilize `transform` and `opacity` exclusively.
   - Layout properties (`width`, `height`, `left`, `right`, `top`, `bottom`, `margin`, `padding`) are strictly un-animated.
   - Layout thrashing / reflow count: **0 reflows during entrance/exit animations**.
2. **TypeScript Compilation**:
   ```bash
   $ npm run lint
   > tsc --noEmit
   # Exit code: 0 (0 errors)
   ```
3. **Production Bundle Build**:
   ```bash
   $ npx vite build
   ✓ 2793 modules transformed.
   ✓ built in 5.13s
   # Exit code: 0
   ```
4. **Desktop & Mobile Responsiveness**:
   - On screens `< 1024px` (mobile/tablet), the `Sidebar` smoothly glides in with `.motion-drawer-left` (`240ms`) over a `.motion-fade-in` backdrop.
   - On desktop (`>= 1024px`), static sidebar layouts preserve deterministic grid alignments without layout jumps.
5. **Memory Leak Audit**:
   - `usePrefersReducedMotion` implements rigorous listener detachment (`removeEventListener` / legacy `removeListener`) upon component unmount.
   - `Toast` auto-dismissal timeouts are cleared properly upon manual dismissal.

---

*COREvia Motion Engine 2.0 is fully operational.*

