
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { StoriesProvider } from '@/contexts/StoriesContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import { routes } from './routes';

function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <StoriesProvider>
          <TooltipProvider>
            <RouterProvider router={routes} />
            <Toaster />
          </TooltipProvider>
        </StoriesProvider>
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App;
