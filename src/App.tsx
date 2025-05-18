
import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { StoriesProvider } from '@/contexts/StoriesContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import { N8nProvider } from '@/contexts/N8nContext';
import AppRoutes from './routes';

function App() {
  // Create a router from the routes
  const router = createBrowserRouter([{ path: "*", element: <AppRoutes /> }]);
  
  return (
    <AuthProvider>
      <ProjectProvider>
        <StoriesProvider>
          <N8nProvider>
            <TooltipProvider>
              <RouterProvider router={router} />
              <Toaster />
            </TooltipProvider>
          </N8nProvider>
        </StoriesProvider>
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App;
