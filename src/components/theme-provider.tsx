
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeContext = createContext<{ theme: string | undefined }>({ theme: 'light' });

// Wrapper to provide next-themes provider
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemeConsumer>{children}</ThemeConsumer>
    </NextThemesProvider>
  );
}

// Inner consumer component that uses the useTheme hook
function ThemeConsumer({ children }: { children: React.ReactNode }) {
  const { resolvedTheme, systemTheme } = useTheme();
  const theme = resolvedTheme || systemTheme || 'light';
  
  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useCurrentTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useCurrentTheme must be used within a ThemeProvider');
  }
  return context;
};
