
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { applyTheme, ThemeColors } from '@/lib/theme';

interface ThemeContextType {
  colors: ThemeColors;
  setColors: (colors: ThemeColors) => void;
  updateColor: (type: 'primary' | 'accent', color: string) => void;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Default colors (same as in globals.css)
const DEFAULT_COLORS: ThemeColors = {
  primary: '#468432', // Green
  accent: '#2f7f9f',  // Blue
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colors, setColorsState] = useState<ThemeColors>(DEFAULT_COLORS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load colors from localStorage or API on mount
  useEffect(() => {
    const savedColors = localStorage.getItem('orbitech-theme-colors');
    if (savedColors) {
      try {
        const parsed = JSON.parse(savedColors);
        setColorsState(parsed);
        applyTheme(parsed);
      } catch (e) {
        console.error('Failed to parse theme colors', e);
      }
    } else {
      applyTheme(DEFAULT_COLORS);
    }
    setIsLoaded(true);
  }, []);

  const setColors = (newColors: ThemeColors) => {
    setColorsState(newColors);
    applyTheme(newColors);
    localStorage.setItem('orbitech-theme-colors', JSON.stringify(newColors));
  };

  const updateColor = (type: 'primary' | 'accent', color: string) => {
    const newColors = { ...colors, [type]: color };
    setColors(newColors);
  };

  return (
    <ThemeContext.Provider value={{ colors, setColors, updateColor, isLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
