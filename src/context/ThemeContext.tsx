import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { brandColors } from '../styles/tokens';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode | ((prev: ThemeMode) => ThemeMode)) => void;
  toggleTheme: () => void;
  colors: typeof brandColors.light;
  isDark: boolean;
}

const STORAGE_KEY = 'corevia_theme_mode';
const LEGACY_STORAGE_KEY = 'corevia_theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = (localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)) as ThemeMode | null;
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch (e) {
    console.warn('localStorage unavailable for theme preference:', e);
  }
  return 'system';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  // Listen to OS system color-scheme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (theme === 'system') return systemTheme;
    return theme;
  }, [theme, systemTheme]);

  const isDark = resolvedTheme === 'dark';

  // Apply class and data attribute to documentElement
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  }, [isDark]);

  const setTheme = useCallback((action: ThemeMode | ((prev: ThemeMode) => ThemeMode)) => {
    setThemeState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      try {
        localStorage.setItem(STORAGE_KEY, next);
        localStorage.setItem(LEGACY_STORAGE_KEY, next);
      } catch (e) {
        console.warn('Failed to persist theme preference:', e);
      }
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  }, [setTheme]);

  const activeColors = useMemo(() => {
    return isDark ? (brandColors.dark as unknown as typeof brandColors.light) : brandColors.light;
  }, [isDark]);

  const contextValue = useMemo<ThemeContextValue>(() => ({
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    colors: activeColors,
    isDark,
  }), [theme, resolvedTheme, setTheme, toggleTheme, activeColors, isDark]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

