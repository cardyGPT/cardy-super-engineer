
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeContext = createContext<{ theme: string | undefined }>({ theme: 'light' });

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme, resolvedTheme, systemTheme } = useTheme();

  return (
    <ThemeContext.Provider value={{ theme: resolvedTheme || systemTheme || 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useCurrentTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useCurrentTheme must be used within a ThemeProvider');
  }
  return context;
};
