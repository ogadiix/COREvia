/**
 * COREvia Institutional Design System 2.0 — Design Tokens
 * Philosophy: INSTITUTIONAL CLARITY + PREMIUM INTERACTION
 */

export const colors = {
  // Primary Institutional Brand
  brand: {
    DEFAULT: '#087F8C',
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#087F8C',
    600: '#066974',
    700: '#05535c',
    800: '#044148',
    900: '#033238',
    950: '#022024',
  },

  // Surfaces & Backgrounds
  background: '#F5F7FA',
  surface: {
    DEFAULT: '#FFFFFF',
    secondary: '#F8FAFC',
    sunken: '#F1F5F9',
  },

  // Borders
  border: {
    DEFAULT: '#E2E8F0',
    subtle: '#E2E8F0',
    strong: '#CBD5E1',
    interactive: '#94A3B8',
  },

  // Typography
  text: {
    primary: '#172033',
    secondary: '#475569',
    muted: '#64748B',
    inverted: '#FFFFFF',
  },

  // Semantic Status Tints
  status: {
    success: {
      DEFAULT: '#16803C',
      subtle: '#f0fdf4',
      border: '#bbf7d0',
      text: '#14532d',
    },
    warning: {
      DEFAULT: '#B45309',
      subtle: '#fffbeb',
      border: '#fde68a',
      text: '#78350f',
    },
    danger: {
      DEFAULT: '#B42318',
      subtle: '#fef2f2',
      border: '#fecaca',
      text: '#7f1d1d',
    },
    info: {
      DEFAULT: '#2563EB',
      subtle: '#eff6ff',
      border: '#bfdbfe',
      text: '#1e3a8a',
    },
  },

  // Institutional Navy Accent
  navy: {
    DEFAULT: '#0f1e36',
    hover: '#1b2e4b',
    active: '#091322',
    900: '#0f1e36',
    950: '#0b1626',
  },
} as const;

export const typography = {
  fontFamily: {
    sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  fontSize: {
    '2xs': ['10px', '14px'],
    xs: ['12px', '16px'],
    sm: ['13px', '18px'],
    base: ['14px', '20px'],
    md: ['15px', '22px'],
    lg: ['16px', '24px'],
    xl: ['18px', '26px'],
    '2xl': ['20px', '28px'],
    '3xl': ['24px', '32px'],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const spacing = {
  0: '0px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
} as const;

export const radii = {
  none: '0px',
  xs: '2px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
} as const;

export const shadows = {
  none: 'none',
  '2xs': '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
  xs: '0 1px 2px 0 rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.03)',
  sm: '0 2px 4px -1px rgba(15, 23, 42, 0.06), 0 4px 6px -1px rgba(15, 23, 42, 0.04)',
  md: '0 4px 6px -2px rgba(15, 23, 42, 0.05), 0 10px 15px -3px rgba(15, 23, 42, 0.07)',
  lg: '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 20px 25px -5px rgba(15, 23, 42, 0.1)',
} as const;

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

export const transitions = {
  micro: '120ms cubic-bezier(0.2, 0, 0, 1.0)',
  standard: '180ms cubic-bezier(0.2, 0, 0, 1.0)',
  panel: '240ms cubic-bezier(0.0, 0, 0.2, 1.0)',
  page: '200ms cubic-bezier(0.2, 0, 0, 1.0)',
  visualization: '300ms cubic-bezier(0.2, 0, 0, 1.0)',
  fast: '120ms cubic-bezier(0.2, 0, 0, 1.0)',
  normal: '180ms cubic-bezier(0.2, 0, 0, 1.0)',
  slow: '240ms cubic-bezier(0.0, 0, 0.2, 1.0)',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const focusRingClass =
  'outline-none focus-visible:ring-2 focus-visible:ring-[#087F8C] focus-visible:ring-offset-1 focus-visible:ring-offset-white';

export const tokens = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  zIndex,
  transitions,
  breakpoints,
  focusRingClass,
};

export default tokens;
