import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const THEME_KEY = 'rsc_theme';
const isWeb = Platform.OS === 'web';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): ThemeMode {
  if (isWeb) {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'auto') {
        return stored;
      }
    } catch {}
  }
  return 'auto';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(getInitialTheme);
  const [isHydrated, setIsHydrated] = useState(isWeb);

  useEffect(() => {
    if (!isWeb) {
      (async () => {
        try {
          const stored = await SecureStore.getItemAsync(THEME_KEY);
          if (stored === 'light' || stored === 'dark' || stored === 'auto') {
            setModeState(stored);
          }
        } catch {}
        setIsHydrated(true);
      })();
    }
  }, []);

  const setTheme = (newMode: ThemeMode) => {
    setModeState(newMode);
    if (isWeb) localStorage.setItem(THEME_KEY, newMode);
    else SecureStore.setItemAsync(THEME_KEY, newMode).catch(() => {});
  };

  const toggleTheme = () => {
    const newMode = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newMode);
  };

  const resolvedTheme: ResolvedTheme =
    mode === 'auto' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : mode;

  const value: ThemeContextValue = {
    mode,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
