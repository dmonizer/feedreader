'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { dbService } from '@/lib/db';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('auto');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from database on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        await dbService.initialize();
        const settings = await dbService.getSettings();
        setThemeState(settings.theme);
      } catch (error) {
        console.error('Failed to load theme:', error);
        // Default to auto theme
        setThemeState('auto');
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Update actual theme based on theme setting and system preference
  useEffect(() => {
    const updateActualTheme = () => {
      if (theme === 'auto') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setActualTheme(systemPrefersDark ? 'dark' : 'light');
      } else {
        setActualTheme(theme);
      }
    };

    updateActualTheme();

    // Listen for system theme changes when in auto mode
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateActualTheme);

      return () => {
        mediaQuery.removeEventListener('change', updateActualTheme);
      };
    }
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    if (actualTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', actualTheme === 'dark' ? '#1f2937' : '#ffffff');
    }
  }, [actualTheme]);

  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme);

      // Save to database
      await dbService.initialize();
      await dbService.updateSettings({ theme: newTheme });
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const value = {
    theme,
    actualTheme,
    setTheme,
    isLoading,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}