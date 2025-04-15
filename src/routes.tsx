
import { createBrowserRouter, Navigate } from 'react-router-dom';
import StoriesPage from './pages/StoriesPage';
import LoginPage from './pages/LoginPage';
import NotFound from './pages/NotFound';
import SettingsPage from './pages/SettingsPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import CardyMindPage from './pages/CardyMindPage';
import DataModelPage from './pages/DataModelPage';
import DocumentsPage from './pages/DocumentsPage';
import GSuiteSettingsPage from './pages/GSuiteSettingsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

export const routes = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/login',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute><StoriesPage /></ProtectedRoute>,
  },
  {
    path: '/stories',
    element: <ProtectedRoute><StoriesPage /></ProtectedRoute>,
  },
  {
    path: '/settings',
    element: <ProtectedRoute><SettingsPage /></ProtectedRoute>,
  },
  {
    path: '/projects',
    element: <ProtectedRoute><ProjectsPage /></ProtectedRoute>,
  },
  {
    path: '/projects/:projectId',
    element: <ProtectedRoute><ProjectDetailPage /></ProtectedRoute>,
  },
  {
    path: '/cardy-mind',
    element: <ProtectedRoute><CardyMindPage /></ProtectedRoute>,
  },
  {
    path: '/data-model',
    element: <ProtectedRoute><DataModelPage /></ProtectedRoute>,
  },
  {
    path: '/data-models',
    element: <ProtectedRoute><DataModelPage /></ProtectedRoute>,
  },
  {
    path: '/er-diagram',
    element: <ProtectedRoute><DataModelPage /></ProtectedRoute>,
  },
  {
    path: '/smart-er',
    element: <ProtectedRoute><DataModelPage /></ProtectedRoute>,
  },
  {
    path: '/smart-er-diagram',
    element: <ProtectedRoute><DataModelPage /></ProtectedRoute>,
  },
  {
    path: '/docs-model',
    element: <ProtectedRoute><DataModelPage /></ProtectedRoute>,
  },
  {
    path: '/docs-&-data-model',
    element: <ProtectedRoute><DataModelPage /></ProtectedRoute>,
  },
  {
    path: '/docs-and-data-model',
    element: <ProtectedRoute><DataModelPage /></ProtectedRoute>,
  },
  {
    path: '/documents',
    element: <ProtectedRoute><DocumentsPage /></ProtectedRoute>,
  },
  {
    path: '/gsuite-settings',
    element: <ProtectedRoute><GSuiteSettingsPage /></ProtectedRoute>,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
