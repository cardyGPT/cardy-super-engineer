
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { StoriesProvider } from '@/contexts/StoriesContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { routes } from './routes';

function App() {
  return (
    <ProjectProvider>
      <StoriesProvider>
        <RouterProvider router={routes} />
        <Toaster />
      </StoriesProvider>
    </ProjectProvider>
  );
}

export default App;
