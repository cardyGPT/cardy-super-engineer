
import { createBrowserRouter } from 'react-router-dom';
import StoriesPage from './pages/StoriesPage';
import Index from './pages/Index';
import SettingsPage from './pages/SettingsPage';
import NotFound from './pages/NotFound';

export const routes = createBrowserRouter([
  {
    path: '/',
    element: <Index />,
  },
  {
    path: '/stories',
    element: <StoriesPage />,
  },
  {
    path: '/settings',
    element: <SettingsPage />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
