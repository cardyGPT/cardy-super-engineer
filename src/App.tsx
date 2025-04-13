import React from 'react'
import { RouterProvider } from 'react-router-dom'

import { ThemeProvider } from '@/components/theme-provider'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { routes } from './routes'
import { StoriesProvider } from './contexts/StoriesContext';

function App() {
  const queryClient = new QueryClient()
  const { theme } = useTheme()
  
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <ThemeProvider>
        <StoriesProvider>
          <RouterProvider router={routes} />
        </StoriesProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
