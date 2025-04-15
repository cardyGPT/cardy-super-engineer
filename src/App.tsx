
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { StoriesProvider } from '@/contexts/stories/StoriesContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { routes } from './routes';

function App() {
  return (
    <ProjectProvider>
      <StoriesProvider>
        <TooltipProvider>
          <RouterProvider router={routes} />
          <Toaster />
        </TooltipProvider>
      </StoriesProvider>
    </ProjectProvider>
  );
}

export default App;
