import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Theme } from './Theme';
import { applyTheme } from './applyTheme';
import { classicTheme, themes } from './themes';

const STORAGE_KEY = 'backgammon-theme';

function loadSavedTheme(fallback: Theme): Theme {
  try {
    const name = localStorage.getItem(STORAGE_KEY);
    if (name) {
      return themes.find((t) => t.name === name) ?? fallback;
    }
  } catch {
    // localStorage unavailable (SSR, privacy mode) — ignore
  }
  return fallback;
}

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  defaultTheme?: Theme;
  children: ReactNode;
};

export function ThemeProvider({ defaultTheme = classicTheme, children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => loadSavedTheme(defaultTheme));

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t.name);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
