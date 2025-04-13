
import React from 'react'
import { RouterProvider } from 'react-router-dom'

import { ThemeProvider } from '@/components/theme-provider'
import { useTheme } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { routes } from './routes'
import { StoriesProvider } from './contexts/StoriesContext';
import { ProjectProvider } from './contexts/ProjectContext';

function App() {
  const queryClient = new QueryClient()
  const { theme } = useTheme()
  
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <ThemeProvider>
        <ProjectProvider>
          <StoriesProvider>
            <RouterProvider router={routes} />
          </StoriesProvider>
        </ProjectProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
