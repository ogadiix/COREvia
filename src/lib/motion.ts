/**
 * COREvia Institutional Motion Engine
 * Architecture: Tier-1 Core Banking Platform
 * Philosophy: INSTITUTIONAL CLARITY + DETERMINISTIC PHYSICS
 *
 * Core Tenets:
 * 1. Motion communicates state change, spatial hierarchy, or system feedback — never decoration.
 * 2. Animations strictly target GPU-composited properties (transform, opacity).
 * 3. Restrained, deterministic durations:
 *    - Micro: 100–150ms (Toggles, buttons, tooltips, checkmarks)
 *    - Standard: 150–220ms (Dropdowns, modals, toasts, popovers)
 *    - Panel: 200–280ms (Slide-over drawers, command palettes)
 *    - Page: 180–250ms (Module navigation, view crossfades)
 *    - Visualization: 250–400ms (Charts, SVG trees, metric registers)
 * 4. Zero layout shift (CLS = 0): No animating width, height, margin, or layout coordinates.
 * 5. Full support for prefers-reduced-motion (both via CSS and React hooks).
 * 6. Guaranteed resource cleanup and zero memory leaks.
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { Transition, Variants } from 'motion/react';

// ============================================================================
// 1. MOTION TOKENS (Durations & Easings)
// ============================================================================

export const motionDurationMs = {
  micro: 120, // 100–150ms: micro-interactions, toggles, hover, active press
  standard: 180, // 150–220ms: dropdowns, tooltips, dialogs, toasts
  panel: 240, // 200–280ms: slide-over drawers, command surfaces
  page: 200, // 180–250ms: module transitions, tab panels
  visualization: 300, // 250–400ms: charts, graph relayouts, counters
} as const;

export const motionDurationSec = {
  micro: motionDurationMs.micro / 1000,
  standard: motionDurationMs.standard / 1000,
  panel: motionDurationMs.panel / 1000,
  page: motionDurationMs.page / 1000,
  visualization: motionDurationMs.visualization / 1000,
} as const;

export const motionEasing = {
  /** Institutional standard: snappy response with smooth settling */
  standard: [0.2, 0.0, 0, 1.0] as [number, number, number, number],
  standardCss: 'cubic-bezier(0.2, 0.0, 0, 1.0)',

  /** Decelerate (Enter): rapid entrance that glides into position */
  decelerate: [0.0, 0.0, 0.2, 1.0] as [number, number, number, number],
  decelerateCss: 'cubic-bezier(0.0, 0.0, 0.2, 1.0)',

  /** Accelerate (Exit): swift, purposeful departure */
  accelerate: [0.4, 0.0, 1.0, 1.0] as [number, number, number, number],
  accelerateCss: 'cubic-bezier(0.4, 0.0, 1.0, 1.0)',

  /** Linear: constant velocity (for spinners, progress indicators) */
  linear: [0, 0, 1, 1] as [number, number, number, number],
  linearCss: 'linear',

  /** Emphasized: slightly deeper curve for major alerts or modal reveals */
  emphasized: [0.2, 0.0, 0.1, 1.0] as [number, number, number, number],
  emphasizedCss: 'cubic-bezier(0.2, 0.0, 0.1, 1.0)',
} as const;

// ============================================================================
// 2. REUSABLE TRANSITIONS
// ============================================================================

export const motionTransitions: Record<string, Transition> = {
  opacity: {
    duration: motionDurationSec.standard,
    ease: motionEasing.standard,
  },
  transform: {
    duration: motionDurationSec.standard,
    ease: motionEasing.standard,
  },
  hover: {
    duration: motionDurationSec.micro,
    ease: motionEasing.decelerate,
  },
  pressed: {
    duration: motionDurationSec.micro,
    ease: motionEasing.standard,
  },
  focus: {
    duration: motionDurationSec.micro,
    ease: motionEasing.standard,
  },
  dropdown: {
    duration: motionDurationSec.micro,
    ease: motionEasing.decelerate,
  },
  drawer: {
    duration: motionDurationSec.panel,
    ease: motionEasing.decelerate,
  },
  dialog: {
    duration: motionDurationSec.standard,
    ease: motionEasing.decelerate,
  },
  tabChanges: {
    duration: motionDurationSec.micro,
    ease: motionEasing.standard,
  },
  pageNavigation: {
    duration: motionDurationSec.page,
    ease: motionEasing.standard,
  },
  loading: {
    duration: 0.85,
    repeat: Infinity,
    ease: motionEasing.linear,
  },
  reduced: {
    duration: 0.01,
  },
};

// ============================================================================
// 3. REUSABLE MOTION VARIANTS (Motion v12 / Framer Motion compatible)
// ============================================================================

/** Opacity fade for overlays and backdrop curtains */
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: motionDurationSec.standard,
      ease: motionEasing.standard,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: motionDurationSec.micro,
      ease: motionEasing.accelerate,
    },
  },
};

/** Dialog / Modal Entrance: subtle vertical rise + scale (0.98 -> 1) */
export const dialogVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    y: 6,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: motionDurationSec.standard,
      ease: motionEasing.decelerate,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 4,
    transition: {
      duration: motionDurationSec.micro,
      ease: motionEasing.accelerate,
    },
  },
};

/** Slide-over Drawer Variants (Right & Left) */
export const drawerRightVariants: Variants = {
  initial: {
    x: '100%',
    opacity: 0.8,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: motionDurationSec.panel,
      ease: motionEasing.decelerate,
    },
  },
  exit: {
    x: '100%',
    opacity: 0.8,
    transition: {
      duration: motionDurationSec.panel * 0.8,
      ease: motionEasing.accelerate,
    },
  },
};

export const drawerLeftVariants: Variants = {
  initial: {
    x: '-100%',
    opacity: 0.8,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: motionDurationSec.panel,
      ease: motionEasing.decelerate,
    },
  },
  exit: {
    x: '-100%',
    opacity: 0.8,
    transition: {
      duration: motionDurationSec.panel * 0.8,
      ease: motionEasing.accelerate,
    },
  },
};

/** Dropdown / Popover Entrance: tiny 4px drop + scale 0.98 */
export const dropdownVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    y: -4,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: motionDurationSec.micro,
      ease: motionEasing.decelerate,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -4,
    transition: {
      duration: motionDurationSec.micro * 0.8,
      ease: motionEasing.accelerate,
    },
  },
};

/** Toast Notification Entrance */
export const toastVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: motionDurationSec.standard,
      ease: motionEasing.decelerate,
    },
  },
  exit: {
    opacity: 0,
    y: 6,
    scale: 0.98,
    transition: {
      duration: motionDurationSec.micro,
      ease: motionEasing.accelerate,
    },
  },
};

/** Tab Panel Content Crossfade */
export const tabContentVariants: Variants = {
  initial: {
    opacity: 0,
    y: 3,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionDurationSec.micro,
      ease: motionEasing.standard,
    },
  },
  exit: {
    opacity: 0,
    y: -3,
    transition: {
      duration: motionDurationSec.micro * 0.7,
      ease: motionEasing.accelerate,
    },
  },
};

/** Page / Module Navigation Crossfade */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 4,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionDurationSec.page,
      ease: motionEasing.standard,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: motionDurationSec.micro,
      ease: motionEasing.accelerate,
    },
  },
};

/** Subtle Button Tap Feedback */
export const buttonTapMotion = {
  scale: 0.98,
  transition: {
    duration: motionDurationSec.micro,
    ease: motionEasing.standard,
  },
};

// ============================================================================
// 4. PREFERS-REDUCED-MOTION SUPPORT
// ============================================================================

/**
 * Universal Hook detecting user's OS preference for reduced motion.
 * Ensures clean event listener registration and removal without memory leaks.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers support addEventListener on MediaQueryList
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else if ((mediaQuery as any).addListener) {
      // Legacy Safari fallback
      (mediaQuery as any).addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else if ((mediaQuery as any).removeListener) {
        (mediaQuery as any).removeListener(handleChange);
      }
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Motion Context providing global reduced motion override capability.
 */
interface MotionContextType {
  prefersReducedMotion: boolean;
  reducedMotionForced: boolean;
  setReducedMotionForced: (forced: boolean) => void;
  isMotionReduced: boolean;
}

const MotionContext = createContext<MotionContextType>({
  prefersReducedMotion: false,
  reducedMotionForced: false,
  setReducedMotionForced: () => {},
  isMotionReduced: false,
});

export const MotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const prefersReduced = usePrefersReducedMotion();
  const [reducedMotionForced, setReducedMotionForced] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('corevia_reduced_motion') === 'true';
    }
    return false;
  });

  const handleSetReducedMotionForced = (forced: boolean) => {
    setReducedMotionForced(forced);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('corevia_reduced_motion', String(forced));
      }
    } catch {
      // Storage unavailable or sandboxed
    }
  };

  const isMotionReduced = prefersReduced || reducedMotionForced;

  const value = useMemo(
    () => ({
      prefersReducedMotion: prefersReduced,
      reducedMotionForced,
      setReducedMotionForced: handleSetReducedMotionForced,
      isMotionReduced,
    }),
    [prefersReduced, reducedMotionForced, isMotionReduced]
  );

  return React.createElement(MotionContext.Provider, { value }, children);
};

export const useMotionSettings = (): MotionContextType => useContext(MotionContext);

/**
 * Transforms any Motion variants map into a reduced-motion safe variant
 * by stripping spatial offsets (x, y, scale) and rendering instant/opacity-only transitions.
 */
export function getReducedVariants(variants: Variants, shouldReduce: boolean): Variants {
  if (!shouldReduce) return variants;

  const reduced: Variants = {};
  for (const [key, val] of Object.entries(variants)) {
    if (typeof val === 'object' && val !== null) {
      // Retain opacity if present, strip x, y, scale, and force 0 duration
      const { x: _x, y: _y, scale: _scale, transition: _t, ...rest } = val as any;
      reduced[key] = {
        ...rest,
        opacity: rest.opacity !== undefined ? rest.opacity : 1,
        transition: { duration: 0.01 },
      };
    } else {
      reduced[key] = val;
    }
  }
  return reduced;
}

// ============================================================================
// 5. CSS HELPER CONSTANTS FOR INLINE STYLES & TAILWIND
// ============================================================================

export const cssTransitions = {
  micro: `all ${motionDurationMs.micro}ms ${motionEasing.standardCss}`,
  standard: `all ${motionDurationMs.standard}ms ${motionEasing.standardCss}`,
  panel: `transform ${motionDurationMs.panel}ms ${motionEasing.decelerateCss}, opacity ${motionDurationMs.panel}ms ${motionEasing.decelerateCss}`,
  page: `transform ${motionDurationMs.page}ms ${motionEasing.standardCss}, opacity ${motionDurationMs.page}ms ${motionEasing.standardCss}`,
  colors: `color ${motionDurationMs.micro}ms ${motionEasing.standardCss}, background-color ${motionDurationMs.micro}ms ${motionEasing.standardCss}, border-color ${motionDurationMs.micro}ms ${motionEasing.standardCss}`,
  transform: `transform ${motionDurationMs.standard}ms ${motionEasing.standardCss}`,
  opacity: `opacity ${motionDurationMs.standard}ms ${motionEasing.standardCss}`,
} as const;
