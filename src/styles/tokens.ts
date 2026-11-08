/**
 * COREvia Institutional Design System — Design Tokens (v3.0)
 * Philosophy: MODERN INSTITUTIONAL BANKING
 * Dual-Theme Engine: LIGHT & DARK MODE
 * Typography: Inter (Sans) & IBM Plex Mono (Mono)
 */

export const brandColors = {
  // Light Mode Palette
  light: {
    primaryNavy: '#142C45',
    primaryTeal: '#168C83',
    brandHover: '#1B9D92',
    mutedGold: '#D9A441',
    background: '#F4F6F8',
    surface: '#FFFFFF',
    secondarySurface: '#EDF1F5',
    elevatedSurface: '#FFFFFF',
    inputBackground: '#FFFFFF',
    dropdownBackground: '#FFFFFF',
    dialogBackground: '#FFFFFF',
    drawerBackground: '#FFFFFF',
    tableBackground: '#FFFFFF',
    tableHeader: '#F8FAFC',
    tableHover: '#F1F5F9',
    primaryText: '#273444',
    secondaryText: '#5D6B7B',
    mutedText: '#8793A1',
    border: '#DCE3EA',
    subtleBorder: '#E8EEF4',
    status: {
      success: '#16803C',
      successSubtle: '#F0FDF4',
      successBorder: '#BBF7D0',
      warning: '#B7791F',
      warningSubtle: '#FEFCE8',
      warningBorder: '#FEF08A',
      danger: '#B42318',
      dangerSubtle: '#FEF2F2',
      dangerBorder: '#FECACA',
      info: '#2563EB',
      infoSubtle: '#EFF6FF',
      infoBorder: '#BFDBFE',
    },
  },

  // Dark Mode Palette
  dark: {
    primaryNavy: '#142C45',
    primaryTeal: '#168C83',
    brandHover: '#1B9D92',
    mutedGold: '#D9A441',
    background: '#080F19',
    sidebar: '#101C2A',
    header: '#101C2A',
    surface: '#162638',
    secondarySurface: '#192B3D',
    elevatedSurface: '#1C3045',
    inputBackground: '#101C2A',
    dropdownBackground: '#162638',
    dialogBackground: '#162638',
    drawerBackground: '#162638',
    tableBackground: '#162638',
    tableHeader: '#101C2A',
    tableHover: '#20364B',
    primaryText: '#E8EEF5',
    secondaryText: '#A9BACB',
    mutedText: '#8194A8',
    border: '#33485D',
    subtleBorder: '#26394C',
    status: {
      success: '#22C55E',
      successSubtle: '#062814',
      successBorder: '#15803D',
      warning: '#F59E0B',
      warningSubtle: '#341A04',
      warningBorder: '#B45309',
      danger: '#EF4444',
      dangerSubtle: '#370B0B',
      dangerBorder: '#B91C1C',
      info: '#3B82F6',
      infoSubtle: '#0D203F',
      infoBorder: '#1D4ED8',
    },
  },
} as const;

export const semanticColors = {
  success: {
    light: brandColors.light.status.success,
    lightSubtle: brandColors.light.status.successSubtle,
    lightBorder: brandColors.light.status.successBorder,
    dark: brandColors.dark.status.success,
    darkSubtle: brandColors.dark.status.successSubtle,
    darkBorder: brandColors.dark.status.successBorder,
  },
  warning: {
    light: brandColors.light.status.warning,
    lightSubtle: brandColors.light.status.warningSubtle,
    lightBorder: brandColors.light.status.warningBorder,
    dark: brandColors.dark.status.warning,
    darkSubtle: brandColors.dark.status.warningSubtle,
    darkBorder: brandColors.dark.status.warningBorder,
  },
  danger: {
    light: brandColors.light.status.danger,
    lightSubtle: brandColors.light.status.dangerSubtle,
    lightBorder: brandColors.light.status.dangerBorder,
    dark: brandColors.dark.status.danger,
    darkSubtle: brandColors.dark.status.dangerSubtle,
    darkBorder: brandColors.dark.status.dangerBorder,
  },
  info: {
    light: brandColors.light.status.info,
    lightSubtle: brandColors.light.status.infoSubtle,
    lightBorder: brandColors.light.status.infoBorder,
    dark: brandColors.dark.status.info,
    darkSubtle: brandColors.dark.status.infoSubtle,
    darkBorder: brandColors.dark.status.infoBorder,
  },
} as const;

export const colors = {
  brand: {
    DEFAULT: '#168C83',
    50: '#F0FDFB',
    100: '#CCFBF6',
    200: '#99F6ED',
    300: '#5EEADF',
    400: '#2DD4C7',
    500: '#168C83',
    600: '#137971',
    700: '#10635D',
    800: '#0D4E49',
    900: '#0A3936',
    950: '#05211F',
    hover: '#1B9D92',
    navy: '#142C45',
    gold: '#D9A441',
  },
  background: '#F4F6F8',
  surface: {
    DEFAULT: '#FFFFFF',
    secondary: '#EDF1F5',
    sunken: '#E8EEF4',
  },
  border: {
    DEFAULT: '#DCE3EA',
    subtle: '#E8EEF4',
    strong: '#DCE3EA',
    interactive: '#168C83',
  },
  text: {
    primary: '#273444',
    secondary: '#5D6B7B',
    muted: '#8793A1',
    inverted: '#FFFFFF',
  },
  status: {
    success: {
      DEFAULT: '#16803C',
      subtle: '#f0fdf4',
      border: '#bbf7d0',
      text: '#14532d',
    },
    warning: {
      DEFAULT: '#B7791F',
      subtle: '#fefce8',
      border: '#fef08a',
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
  navy: {
    DEFAULT: '#142C45',
    hover: '#1b3858',
    active: '#0c1c2e',
    900: '#142C45',
    950: '#101C2A',
  },
  light: brandColors.light,
  dark: brandColors.dark,
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
  16: '64px',
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

export const elevation = {
  0: {
    shadow: shadows.none,
    lightSurface: brandColors.light.surface,
    darkSurface: brandColors.dark.surface,
  },
  1: {
    shadow: shadows['2xs'],
    lightSurface: brandColors.light.surface,
    darkSurface: brandColors.dark.surface,
  },
  2: {
    shadow: shadows.xs,
    lightSurface: brandColors.light.surface,
    darkSurface: brandColors.dark.secondarySurface,
  },
  3: {
    shadow: shadows.sm,
    lightSurface: brandColors.light.surface,
    darkSurface: brandColors.dark.elevatedSurface,
  },
  4: {
    shadow: shadows.md,
    lightSurface: brandColors.light.surface,
    darkSurface: brandColors.dark.elevatedSurface,
  },
  5: {
    shadow: shadows.lg,
    lightSurface: brandColors.light.surface,
    darkSurface: brandColors.dark.elevatedSurface,
  },
} as const;

export const componentDimensions = {
  button: {
    xs: { height: '26px', paddingX: '8px', fontSize: '11px' },
    sm: { height: '32px', paddingX: '12px', fontSize: '12px' },
    md: { height: '36px', paddingX: '16px', fontSize: '13px' },
    lg: { height: '40px', paddingX: '20px', fontSize: '14px' },
  },
  input: {
    sm: { height: '28px', fontSize: '12px' },
    md: { height: '34px', fontSize: '13px' },
  },
  table: {
    rowCompact: '32px',
    rowDefault: '40px',
    rowRelaxed: '48px',
  },
  navigation: {
    sidebarExpanded: '240px',
    sidebarCollapsed: '64px',
    headerTier1: '42px',
    headerTier2: '40px',
    systemStatusBar: '24px',
  },
  drawer: {
    sm: '380px',
    md: '480px',
    lg: '560px',
    xl: '680px',
  },
  dialog: {
    sm: '400px',
    md: '540px',
    lg: '720px',
    xl: '900px',
  },
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
  'outline-none focus-visible:ring-2 focus-visible:ring-[#168C83] focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#162638]';

export const hoverTransitionClass =
  'transition-colors duration-150 ease-out';

export const tokens = {
  brandColors,
  semanticColors,
  colors,
  typography,
  spacing,
  radii,
  shadows,
  elevation,
  componentDimensions,
  zIndex,
  transitions,
  breakpoints,
  focusRingClass,
  hoverTransitionClass,
};

export default tokens;
