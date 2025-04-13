
import React from 'react'
import { RouterProvider } from 'react-router-dom'

import { ThemeProvider } from '@/components/theme-provider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { routes } from './routes'
import { StoriesProvider } from './contexts/StoriesContext';
import { ProjectProvider } from './contexts/ProjectContext';

function App() {
  const queryClient = new QueryClient()
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ProjectProvider>
          <StoriesProvider>
            <RouterProvider router={routes} />
            <Toaster />
          </StoriesProvider>
        </ProjectProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
