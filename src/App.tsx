
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { StoriesProvider } from '@/contexts/StoriesContext';
import { routes } from './routes';

function App() {
  return (
    <StoriesProvider>
      <RouterProvider router={routes} />
      <Toaster />
    </StoriesProvider>
  );
}

export default App;
