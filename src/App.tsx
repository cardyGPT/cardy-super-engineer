
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { StoriesProvider } from '@/contexts/StoriesContext';

// Pages
import StoriesPage from '@/pages/StoriesPage';
import SettingsPage from '@/pages/SettingsPage';
import NotFound from '@/pages/NotFound'; // Correct import path

function App() {
  return (
    <Router>
      <StoriesProvider>
        <Routes>
          <Route path="/" element={<StoriesPage />} />
          <Route path="/stories" element={<StoriesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </StoriesProvider>
    </Router>
  );
}

export default App;
