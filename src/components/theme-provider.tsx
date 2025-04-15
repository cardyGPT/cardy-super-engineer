
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeContext = createContext<{ theme: string | undefined }>({ theme: 'light' });

// Wrapper to provide next-themes provider
export function ThemeProvider({ children }: ThemeProviderProps) {
  // Always use light theme
  const [theme, setTheme] = useState('light');
  
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ThemeContext.Provider value={{ theme }}>
        {children}
      </ThemeContext.Provider>
    </NextThemesProvider>
  );
}

export const useCurrentTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useCurrentTheme must be used within a ThemeProvider');
  }
  return context;
};
